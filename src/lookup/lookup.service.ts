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
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    return this.prisma.lookup.findUnique({ where: { id: nid } });
  }

  create(data: any) {
    return this.prisma.lookup.create({ data });
  }

  update(id: string, data: any) {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    return this.prisma.lookup.update({ where: { id: nid }, data });
  }

  setActive(id: string, isActive: boolean) {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    return this.prisma.lookup.update({ where: { id: nid }, data: { is_active: isActive } });
  }
}
