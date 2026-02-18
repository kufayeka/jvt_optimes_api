import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as yup from 'yup';
import { validate as uuidValidate } from 'uuid';
import { PrismaService } from '../prisma.service';
import { buildValidationDetails } from '../common/utils/validation';

@Injectable()
export class JobOffsetPrinterTaiyoService {
  constructor(private prisma: PrismaService) {}

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
