import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as yup from 'yup';
import { buildValidationDetails } from '../common/utils/validation';

@Injectable()
export class LookupService {
  constructor(private prisma: PrismaService) {}

  private createValidationSchema() {
    return yup.object({
      lookup_type: yup.string().required('lookup_type is required').max(100, 'lookup_type max length is 100'),
      code: yup.string().required('code is required').max(50, 'code max length is 50'),
      label: yup.string().required('label is required').max(100, 'label max length is 100'),
      description: yup.string().optional().nullable(),
      sort_order: yup.number().optional().nullable(),
      is_active: yup.boolean().optional().nullable(),
      attribute: yup.mixed().optional().nullable(),
    });
  }

  private updateValidationSchema() {
    return yup.object({
      lookup_type: yup.string().optional().max(100, 'lookup_type max length is 100'),
      code: yup.string().optional().max(50, 'code max length is 50'),
      label: yup.string().optional().max(100, 'label max length is 100'),
      description: yup.string().optional().nullable(),
      sort_order: yup.number().optional().nullable(),
      is_active: yup.boolean().optional().nullable(),
      attribute: yup.mixed().optional().nullable(),
    });
  }

  findAll(type?: string) {
    const where = type ? { lookup_type: type } : {};
    return this.prisma.lookup.findMany({ where, orderBy: { sort_order: 'asc' } as any });
  }

  async findOne(id: string) {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const row = await this.prisma.lookup.findUnique({ where: { id: nid } });
    if (!row) throw new NotFoundException('Lookup not found');
    return row;
  }

  async create(data: any) {
    const schema = this.createValidationSchema();
    try {
      await schema.validate(data, { abortEarly: false });
    } catch (e) {
      throw new BadRequestException({ message: 'Validation failed', details: buildValidationDetails(e) });
    }
    return this.prisma.lookup.create({ data });
  }

  async update(id: string, data: any) {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
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
    const existing = await this.prisma.lookup.findUnique({ where: { id: nid } });
    if (!existing) throw new NotFoundException('Lookup not found');
    return this.prisma.lookup.update({ where: { id: nid }, data });
  }

  async setActive(id: string, isActive: boolean) {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'is_active', message: 'is_active must be boolean' }],
      });
    }
    const existing = await this.prisma.lookup.findUnique({ where: { id: nid } });
    if (!existing) throw new NotFoundException('Lookup not found');
    return this.prisma.lookup.update({ where: { id: nid }, data: { is_active: isActive } });
  }
}
