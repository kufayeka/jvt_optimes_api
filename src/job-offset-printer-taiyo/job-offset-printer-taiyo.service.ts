import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as yup from 'yup';
import { validate as uuidValidate } from 'uuid';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma.service';
import { buildValidationDetails } from '../common/utils/validation';

type JobImportError = {
  row: number;
  field: string;
  message: string;
  value?: any;
};

type JobImportCandidate = {
  row: number;
  data: any;
};

const JOB_IMPORT_ALLOWED_FIELDS = new Set([
  'work_order',
  'sales_order',
  'quantity_order',
  'quantity_unit',
  'work_center',
  'planned_start_time',
  'release_date',
  'due_date',
  'job_priority',
  'notes',
  'attribute',
]);

const FORBIDDEN_PAYLOAD_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

@Injectable()
export class JobOffsetPrinterTaiyoService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const lifecycles = await this.prisma.lookup.findMany({
      where: { lookup_type: 'JOB_LIFECYCLE_STATE' },
      select: { id: true, code: true },
    });
    const idToCode = new Map<number, string>();
    lifecycles.forEach((l) => idToCode.set(l.id, l.code));

    const grouped = await this.prisma.jobOffsetPrinterTaiyo.groupBy({
      by: ['job_lifecycle_state'],
      _count: { _all: true },
    });

    const counts: Record<string, number> = {};
    let total = 0;
    grouped.forEach((g) => {
      const code = idToCode.get(g.job_lifecycle_state) || 'OTHER';
      const count = g._count._all;
      counts[code] = (counts[code] || 0) + count;
      total += count;
    });

    const scheduled = counts.SCHEDULED || 0;
    const released = counts.RELEASED || 0;
    const running = counts.RUNNING || 0;
    const completed = counts.COMPLETED || 0;
    const suspended = counts.SUSPENDED || 0;

    const knownTotal = scheduled + released + running + completed + suspended;
    const other = Math.max(0, total - knownTotal);

    return {
      total,
      scheduled,
      released,
      running,
      completed,
      suspended,
      other,
      generated_at: new Date().toISOString(),
    };
  }

  downloadImportTemplate() {
    try {
      const headers = [
        'work_order',
        'sales_order',
        'quantity_order',
        'quantity_unit',
        'work_center',
        'planned_start_time',
        'release_date',
        'due_date',
        'job_priority',
        'notes',
        'attribute',
      ];
      const sample = [
        'WO-2026-0001',
        'SO-2026-0188',
        1,
        'BK',
        'MACHINE_A',
        '2026-02-20T08:00:00.000Z',
        '',
        '2026-02-21T16:00:00.000Z',
        'HIGH',
        'Print urgent order',
        '{"customer":"ABC","color":"CMYK"}',
      ];

      const sheet = XLSX.utils.aoa_to_sheet([headers, sample]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'jobs');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      return {
        filename: 'job-offset-printer-taiyo-template.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer,
      };
    } catch (e) {
      throw new ServiceUnavailableException('Failed to generate excel template');
    }
  }

  async uploadPreviewExcel(file: any) {
    if (!file?.buffer || !file?.originalname) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'file', message: 'Excel file is required' }],
      });
    }

    const fileName = String(file.originalname).toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'file', message: 'Only .xlsx or .xls files are allowed' }],
      });
    }

    let rows: any[] = [];
    try {
      const wb = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
      const firstSheet = wb.SheetNames?.[0];
      if (!firstSheet) {
        throw new Error('No worksheet found');
      }
      rows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], { defval: null, raw: false });
    } catch (e) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'file', message: 'Failed to parse excel file' }],
      });
    }

    if (!rows.length) {
      return {
        total_rows: 0,
        valid_rows: 0,
        invalid_rows: 0,
        data: [],
        errors: [],
      };
    }

    return this.validateJobImportRows(rows, 2);
  }

  async batchCreateFromJson(rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'body', message: 'Request body must be a non-empty JSON array' }],
      });
    }

    const payloadDetails: { field: string; message: string }[] = [];
    const sanitizedRows = rows.map((row, idx) => {
      const rowNumber = idx + 1;
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        payloadDetails.push({
          field: `row[${rowNumber}]`,
          message: 'Each item must be a plain JSON object',
        });
        return {};
      }

      const originalKeys = Object.keys(row);
      originalKeys.forEach((k) => {
        if (FORBIDDEN_PAYLOAD_KEYS.has(k)) {
          payloadDetails.push({
            field: `row[${rowNumber}].${k}`,
            message: 'Forbidden key is not allowed',
          });
        }
      });

      const unknownKeys = originalKeys
        .map((k) => String(k).trim().toLowerCase().replace(/\s+/g, '_'))
        .filter((k) => !JOB_IMPORT_ALLOWED_FIELDS.has(k));
      if (unknownKeys.length) {
        unknownKeys.forEach((k) => {
          payloadDetails.push({
            field: `row[${rowNumber}].${k}`,
            message: 'Unknown field is not allowed in batch-create payload',
          });
        });
      }

      return row;
    });

    if (payloadDetails.length) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: payloadDetails,
      });
    }

    const preview = await this.validateJobImportRows(sanitizedRows, 1);
    if (preview.invalid_rows > 0) {
      return {
        created_count: 0,
        failed_count: preview.invalid_rows,
        created: [],
        errors: preview.errors,
      };
    }

    const created: any[] = [];
    const errors: JobImportError[] = [];
    for (const item of preview.data) {
      try {
        const saved = await this.add(item);
        created.push(saved);
      } catch (e: any) {
        const details = e?.response?.details;
        if (Array.isArray(details) && details.length) {
          details.forEach((d: any) =>
            errors.push({
              row: item.__row || 0,
              field: d.field || 'unknown',
              message: d.message || 'Business validation failed',
              value: item?.[d.field],
            }),
          );
        } else {
          errors.push({
            row: item.__row || 0,
            field: 'row',
            message: e?.message || 'Failed to create job',
          });
        }
      }
    }

    return {
      created_count: created.length,
      failed_count: errors.length ? new Set(errors.map((e) => e.row)).size : 0,
      created,
      errors,
    };
  }

  async getAll() {
    const rows = await this.prisma.jobOffsetPrinterTaiyo.findMany({
      include: {
        quantity_unit_lookup: true,
        work_center_lookup: true,
        job_priority_lookup: true,
        job_lifecycle_lookup: true,
      },
      orderBy: { planned_start_time: 'asc' },
    });
    return rows.map((r: any) => this.formatJob(r));
  }

  async getById(id: string) {
    this.validateUuid(id);
    const row = await this.findJobWithLookups(id);
    if (!row) throw new NotFoundException('Job not found');
    return this.formatJob(row);
  }

  private validateUuid(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'id', message: 'Invalid UUID format' }],
      });
    }
  }

  private createValidationSchema() {
    return yup.object({
      work_order: yup.string().required('work_order is required').max(100, 'work_order max length is 100'),
      sales_order: yup.string().required('sales_order is required').max(100, 'sales_order max length is 100'),
      quantity_order: yup.number().integer('quantity_order must be integer').min(1, 'quantity_order minimum is 1').optional(),
      quantity_unit: yup.mixed().required('quantity_unit is required'),
      work_center: yup.mixed().required('work_center is required'),
      planned_start_time: yup.date().required('planned_start_time is required'),
      release_date: yup.date().optional().nullable(),
      due_date: yup.date().optional().nullable(),
      job_priority: yup.mixed().required('job_priority is required'),
      notes: yup.string().optional(),
      attribute: yup.mixed().optional().nullable(),
    });
  }

  private updateValidationSchema() {
    return yup.object({
      work_order: yup.string().optional().max(100, 'work_order max length is 100'),
      sales_order: yup.string().optional().max(100, 'sales_order max length is 100'),
      quantity_order: yup.number().integer('quantity_order must be integer').min(1, 'quantity_order minimum is 1').optional(),
      quantity_unit: yup.mixed().optional(),
      work_center: yup.mixed().optional(),
      planned_start_time: yup.date().optional(),
      release_date: yup.date().optional().nullable(),
      due_date: yup.date().optional().nullable(),
      job_priority: yup.mixed().optional(),
      notes: yup.string().optional(),
      attribute: yup.mixed().optional().nullable(),
    });
  }

  private parseLookupId(value: string | number, field: string): number {
    const id = typeof value === 'string' ? parseInt(value, 10) : value;
    if (typeof id !== 'number' || Number.isNaN(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field, message: `${field} must be a valid lookup id` }],
      });
    }
    return id;
  }

  private async resolveLookup(lookupId: string | number, lookupType: string, field: string) {
    const id = this.parseLookupId(lookupId, field);
    const row = await this.prisma.lookup.findUnique({ where: { id } });
    if (!row || row.lookup_type !== lookupType) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field, message: `${field} lookup not found or invalid type (${lookupType})` }],
      });
    }
    return row;
  }

  private async resolveLifecycle(code: string) {
    const row = await this.prisma.lookup.findFirst({ where: { lookup_type: 'JOB_LIFECYCLE_STATE', code } });
    if (!row) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'job_lifecycle_state', message: `JOB_LIFECYCLE_STATE ${code} not seeded` }],
      });
    }
    return row;
  }

  private async assertUniqueWorkOrder(workOrder: string, exceptId?: string) {
    const existing = await this.prisma.jobOffsetPrinterTaiyo.findFirst({
      where: { work_order: workOrder, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Work order already exists',
        details: [{ field: 'work_order', message: 'Work order already exists' }],
      });
    }
  }

  private async assertNoTimeWorkCenterConflict(work_center: number, planned_start_time: Date, exceptId?: string) {
    const existing = await this.prisma.jobOffsetPrinterTaiyo.findFirst({
      where: {
        work_center,
        planned_start_time,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Schedule conflict',
        details: [
          {
            field: 'planned_start_time',
            message: 'planned_start_time conflicts with another job in the same work_center',
          },
        ],
      });
    }
  }

  private async findJobWithLookups(id: string) {
    return this.prisma.jobOffsetPrinterTaiyo.findUnique({
      where: { id },
      include: {
        quantity_unit_lookup: true,
        work_center_lookup: true,
        job_priority_lookup: true,
        job_lifecycle_lookup: true,
      },
    });
  }

  private formatJob(row: any) {
    if (!row) return row;
    const {
      quantity_unit_lookup,
      work_center_lookup,
      job_priority_lookup,
      job_lifecycle_lookup,
      ...rest
    } = row;
    return {
      ...rest,
      quantity_unit: quantity_unit_lookup || null,
      work_center: work_center_lookup || null,
      job_priority: job_priority_lookup || null,
      job_lifecycle_state: job_lifecycle_lookup || null,
    };
  }

  private ensureScheduledLifecycle(row: any, action: 'edit' | 'delete') {
    if (row?.job_lifecycle_lookup?.code !== 'SCHEDULED') {
      throw new ForbiddenException(`Cannot ${action} job unless status is SCHEDULED`);
    }
  }

  private normalizeImportRow(row: any) {
    const normalized: Record<string, any> = {};
    Object.keys(row || {}).forEach((k) => {
      const nk = String(k).trim().toLowerCase().replace(/\s+/g, '_');
      normalized[nk] = row[k];
    });
    return normalized;
  }

  private parseDateField(value: any, field: string, rowNumber: number, errors: JobImportError[]): Date | null {
    if (value === undefined || value === null || value === '') return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      errors.push({ row: rowNumber, field, message: `${field} must be a valid date`, value });
      return null;
    }
    return d;
  }

  private parseIntegerField(value: any, field: string, rowNumber: number, errors: JobImportError[], defaultValue?: number) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    const num = typeof value === 'number' ? value : parseInt(String(value), 10);
    if (!Number.isInteger(num) || num < 1) {
      errors.push({ row: rowNumber, field, message: `${field} must be integer >= 1`, value });
      return null;
    }
    return num;
  }

  private parseJsonField(value: any, field: string, rowNumber: number, errors: JobImportError[]) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(String(value));
    } catch {
      errors.push({ row: rowNumber, field, message: `${field} must be a valid JSON object/string`, value });
      return null;
    }
  }

  private resolveLookupForImport(
    value: any,
    lookupType: string,
    field: string,
    rowNumber: number,
    errors: JobImportError[],
    codeMaps: Map<string, number>,
    idMaps: Set<number>,
  ) {
    if (value === undefined || value === null || value === '') {
      errors.push({ row: rowNumber, field, message: `${field} is required` });
      return null;
    }

    const asString = String(value).trim();
    const asNumber = Number(asString);
    if (!Number.isNaN(asNumber) && Number.isInteger(asNumber)) {
      if (idMaps.has(asNumber)) return asNumber;
      errors.push({
        row: rowNumber,
        field,
        message: `${field} lookup not found for type ${lookupType}`,
        value,
      });
      return null;
    }

    const id = codeMaps.get(asString.toUpperCase());
    if (!id) {
      errors.push({
        row: rowNumber,
        field,
        message: `${field} lookup code not found for type ${lookupType}`,
        value,
      });
      return null;
    }
    return id;
  }

  private async validateJobImportRows(rows: any[], rowStart: number) {
    const errors: JobImportError[] = [];
    const candidates: JobImportCandidate[] = [];

    const lookupTypes = ['QUANTITY_UNIT', 'WORK_CENTER', 'JOB_PRIORITY'];
    const lookups = await this.prisma.lookup.findMany({
      where: { lookup_type: { in: lookupTypes } },
      select: { id: true, lookup_type: true, code: true },
    });

    const codeMaps: Record<string, Map<string, number>> = {
      QUANTITY_UNIT: new Map(),
      WORK_CENTER: new Map(),
      JOB_PRIORITY: new Map(),
    };
    const idMaps: Record<string, Set<number>> = {
      QUANTITY_UNIT: new Set(),
      WORK_CENTER: new Set(),
      JOB_PRIORITY: new Set(),
    };

    lookups.forEach((l) => {
      codeMaps[l.lookup_type].set(l.code.toUpperCase(), l.id);
      idMaps[l.lookup_type].add(l.id);
    });

    rows.forEach((raw, idx) => {
      const rowNumber = idx + rowStart;
      const row = this.normalizeImportRow(raw);

      const work_order = String(row.work_order ?? '').trim();
      const sales_order = String(row.sales_order ?? '').trim();
      if (!work_order) errors.push({ row: rowNumber, field: 'work_order', message: 'work_order is required' });
      if (!sales_order) errors.push({ row: rowNumber, field: 'sales_order', message: 'sales_order is required' });
      if (work_order && work_order.length > 100) errors.push({ row: rowNumber, field: 'work_order', message: 'work_order max length is 100', value: work_order });
      if (sales_order && sales_order.length > 100) errors.push({ row: rowNumber, field: 'sales_order', message: 'sales_order max length is 100', value: sales_order });

      const quantity_order = this.parseIntegerField(row.quantity_order, 'quantity_order', rowNumber, errors, 1);
      const planned_start_time = this.parseDateField(row.planned_start_time, 'planned_start_time', rowNumber, errors);
      const release_date = this.parseDateField(row.release_date, 'release_date', rowNumber, errors);
      const due_date = this.parseDateField(row.due_date, 'due_date', rowNumber, errors);
      const attribute = this.parseJsonField(row.attribute, 'attribute', rowNumber, errors);

      const quantity_unit = this.resolveLookupForImport(
        row.quantity_unit,
        'QUANTITY_UNIT',
        'quantity_unit',
        rowNumber,
        errors,
        codeMaps.QUANTITY_UNIT,
        idMaps.QUANTITY_UNIT,
      );
      const work_center = this.resolveLookupForImport(
        row.work_center,
        'WORK_CENTER',
        'work_center',
        rowNumber,
        errors,
        codeMaps.WORK_CENTER,
        idMaps.WORK_CENTER,
      );
      const job_priority = this.resolveLookupForImport(
        row.job_priority,
        'JOB_PRIORITY',
        'job_priority',
        rowNumber,
        errors,
        codeMaps.JOB_PRIORITY,
        idMaps.JOB_PRIORITY,
      );

      candidates.push({
        row: rowNumber,
        data: {
          __row: rowNumber,
          work_order,
          sales_order,
          quantity_order,
          quantity_unit,
          work_center,
          planned_start_time: planned_start_time?.toISOString() || null,
          release_date: release_date?.toISOString() || null,
          due_date: due_date?.toISOString() || null,
          job_priority,
          notes: row.notes ?? '-',
          attribute,
        },
      });
    });

    const workOrderRows = new Map<string, number>();
    const scheduleRows = new Map<string, number>();
    candidates.forEach((c) => {
      if (c.data.work_order) {
        const prev = workOrderRows.get(c.data.work_order);
        if (prev) {
          errors.push({ row: c.row, field: 'work_order', message: `Duplicate work_order in file (first found at row ${prev})`, value: c.data.work_order });
        } else {
          workOrderRows.set(c.data.work_order, c.row);
        }
      }
      if (c.data.work_center && c.data.planned_start_time) {
        const key = `${c.data.work_center}::${c.data.planned_start_time}`;
        const prev = scheduleRows.get(key);
        if (prev) {
          errors.push({ row: c.row, field: 'planned_start_time', message: `Duplicate work_center + planned_start_time in file (first found at row ${prev})` });
        } else {
          scheduleRows.set(key, c.row);
        }
      }
    });

    const workOrders = Array.from(new Set(candidates.map((c) => c.data.work_order).filter(Boolean)));
    if (workOrders.length) {
      const existing = await this.prisma.jobOffsetPrinterTaiyo.findMany({
        where: { work_order: { in: workOrders } },
        select: { work_order: true },
      });
      const existingSet = new Set(existing.map((e) => e.work_order));
      candidates.forEach((c) => {
        if (existingSet.has(c.data.work_order)) {
          errors.push({ row: c.row, field: 'work_order', message: 'Work order already exists', value: c.data.work_order });
        }
      });
    }

    for (const c of candidates) {
      if (!c.data.work_center || !c.data.planned_start_time) continue;
      const conflict = await this.prisma.jobOffsetPrinterTaiyo.findFirst({
        where: {
          work_center: c.data.work_center,
          planned_start_time: new Date(c.data.planned_start_time),
        },
        select: { id: true },
      });
      if (conflict) {
        errors.push({
          row: c.row,
          field: 'planned_start_time',
          message: 'planned_start_time conflicts with another job in the same work_center',
          value: c.data.planned_start_time,
        });
      }
    }

    const badRows = new Set(errors.map((e) => e.row));
    const data = candidates.filter((c) => !badRows.has(c.row)).map((c) => c.data);

    return {
      total_rows: rows.length,
      valid_rows: data.length,
      invalid_rows: badRows.size,
      data,
      errors,
    };
  }

  async add(data: any) {
    const schema = this.createValidationSchema();
    try {
      await schema.validate(data, { abortEarly: false });
    } catch (e) {
      throw new BadRequestException({ message: 'Validation failed', details: buildValidationDetails(e) });
    }

    await this.resolveLookup(data.quantity_unit, 'QUANTITY_UNIT', 'quantity_unit');
    const workCenter = await this.resolveLookup(data.work_center, 'WORK_CENTER', 'work_center');
    await this.resolveLookup(data.job_priority, 'JOB_PRIORITY', 'job_priority');

    await this.assertUniqueWorkOrder(data.work_order);
    await this.assertNoTimeWorkCenterConflict(workCenter.id, new Date(data.planned_start_time));

    const scheduled = await this.resolveLifecycle('SCHEDULED');

    const payload: any = {
      work_order: data.work_order,
      sales_order: data.sales_order,
      quantity_order: data.quantity_order ?? 1,
      quantity_unit: this.parseLookupId(data.quantity_unit, 'quantity_unit'),
      work_center: workCenter.id,
      planned_start_time: new Date(data.planned_start_time),
      release_date: data.release_date ? new Date(data.release_date) : null,
      due_date: data.due_date ? new Date(data.due_date) : null,
      job_priority: this.parseLookupId(data.job_priority, 'job_priority'),
      job_lifecycle_state: scheduled.id,
      notes: data.notes ?? '-',
      attribute: data.attribute ?? null,
    };

    const created = await this.prisma.jobOffsetPrinterTaiyo.create({ data: payload });
    const fresh = await this.findJobWithLookups(created.id);
    return this.formatJob(fresh as any);
  }

  async update(id: string, data: any) {
    this.validateUuid(id);

    const schema = this.updateValidationSchema();
    try {
      await schema.validate(data, { abortEarly: false });
    } catch (e) {
      throw new BadRequestException({ message: 'Validation failed', details: buildValidationDetails(e) });
    }

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'body', message: 'At least one field is required' }],
      });
    }

    const current = await this.findJobWithLookups(id);
    if (!current) throw new NotFoundException('Job not found');
    this.ensureScheduledLifecycle(current, 'edit');

    const nextWorkOrder = data.work_order ?? current.work_order;
    const nextWorkCenter = data.work_center
      ? (await this.resolveLookup(data.work_center, 'WORK_CENTER', 'work_center')).id
      : current.work_center;
    const nextPlannedStartTime = data.planned_start_time ? new Date(data.planned_start_time) : current.planned_start_time;

    await this.assertUniqueWorkOrder(nextWorkOrder, id);
    await this.assertNoTimeWorkCenterConflict(nextWorkCenter, nextPlannedStartTime, id);

    if (data.quantity_unit !== undefined) {
      await this.resolveLookup(data.quantity_unit, 'QUANTITY_UNIT', 'quantity_unit');
    }
    if (data.job_priority !== undefined) {
      await this.resolveLookup(data.job_priority, 'JOB_PRIORITY', 'job_priority');
    }

    const updateData: any = {};
    if (data.work_order !== undefined) updateData.work_order = data.work_order;
    if (data.sales_order !== undefined) updateData.sales_order = data.sales_order;
    if (data.quantity_order !== undefined) updateData.quantity_order = data.quantity_order;
    if (data.quantity_unit !== undefined) updateData.quantity_unit = this.parseLookupId(data.quantity_unit, 'quantity_unit');
    if (data.work_center !== undefined) updateData.work_center = this.parseLookupId(data.work_center, 'work_center');
    if (data.planned_start_time !== undefined) updateData.planned_start_time = new Date(data.planned_start_time);
    if (data.release_date !== undefined) updateData.release_date = data.release_date ? new Date(data.release_date) : null;
    if (data.due_date !== undefined) updateData.due_date = data.due_date ? new Date(data.due_date) : null;
    if (data.job_priority !== undefined) updateData.job_priority = this.parseLookupId(data.job_priority, 'job_priority');
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.attribute !== undefined) updateData.attribute = data.attribute;

    await this.prisma.jobOffsetPrinterTaiyo.update({ where: { id }, data: updateData });
    const fresh = await this.findJobWithLookups(id);
    return this.formatJob(fresh as any);
  }

  async remove(id: string) {
    this.validateUuid(id);
    const current = await this.findJobWithLookups(id);
    if (!current) throw new NotFoundException('Job not found');
    this.ensureScheduledLifecycle(current, 'delete');

    await this.prisma.jobOffsetPrinterTaiyo.delete({ where: { id } });
    return this.formatJob(current);
  }

  private async transition(id: string, allowedFrom: string[], toCode: string, actionName: string) {
    this.validateUuid(id);
    const current = await this.findJobWithLookups(id);
    if (!current) throw new NotFoundException('Job not found');

    const currentCode = current.job_lifecycle_lookup?.code;
    if (!allowedFrom.includes(currentCode)) {
      throw new ForbiddenException(`Cannot ${actionName} job from status ${currentCode}`);
    }

    const next = await this.resolveLifecycle(toCode);
    await this.prisma.jobOffsetPrinterTaiyo.update({
      where: { id },
      data: { job_lifecycle_state: next.id },
    });
    const fresh = await this.findJobWithLookups(id);
    return this.formatJob(fresh as any);
  }

  release(id: string) {
    return this.transition(id, ['SCHEDULED'], 'RELEASED', 'release');
  }

  run(id: string) {
    return this.transition(id, ['RELEASED'], 'RUNNING', 'run');
  }

  suspend(id: string) {
    return this.transition(id, ['RELEASED', 'RUNNING'], 'SUSPENDED', 'suspend');
  }

  complete(id: string) {
    return this.transition(id, ['RUNNING', 'SUSPENDED'], 'COMPLETED', 'complete');
  }

  close(id: string) {
    return this.transition(id, ['RELEASED', 'COMPLETED'], 'CLOSED', 'close');
  }
}
