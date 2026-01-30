import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LookupService {
  constructor(private prisma: PrismaService) {}

  findAll(type?: string) {
    const where = type ? { lookup_type: type } : {};
    return this.prisma.lookup.findMany({ where, orderBy: { sort_order: 'asc' } as any });
  }

  findOne(id: string) {
    return this.prisma.lookup.findUnique({ where: { id: id } });
  }

  create(data: any) {
    return this.prisma.lookup.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.lookup.update({ where: { id: id }, data });
  }

  setActive(id: string, isActive: boolean) {
    return this.prisma.lookup.update({ where: { id: id }, data: { is_active: isActive } });
  }
}
