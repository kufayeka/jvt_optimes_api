import { Injectable, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as yup from 'yup';
import * as bcrypt from 'bcrypt';
import { buildValidationDetails } from '../common/utils/validation';
import { validate as uuidValidate } from 'uuid';

const USERNAME_REGEX = /^[a-z][a-z0-9_]{3,19}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=[\]{}|;:,.<>]{12,}$/;
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const PASSWORD_EXPIRY_MONTHS = 3;

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.account.findMany({
      where: { account_lifecycle_lookup: { code: { not: 'DELETED' } } },
      include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true },
     });
    return rows.map((r: any) => this.formatAccount(r as any));
  }

  async getDashboard() {
    const lifecycles = await this.prisma.lookup.findMany({
      where: { lookup_type: 'ACCOUNT_LIFECYCLE' },
      select: { id: true, code: true },
    });
    const idToCode = new Map<number, string>();
    lifecycles.forEach((l) => idToCode.set(l.id, l.code));

    const grouped = await this.prisma.account.groupBy({
      by: ['account_lifecycle'],
      _count: { _all: true },
    });

    const counts: Record<string, number> = {};
    let total = 0;
    grouped.forEach((g) => {
      const code = idToCode.get(g.account_lifecycle) || 'OTHER';
      const count = g._count._all;
      counts[code] = (counts[code] || 0) + count;
      total += count;
    });

    const active = counts.ACTIVE || 0;
    const disabled = counts.DISABLED || 0;
    const created = counts.CREATED || 0;
    const expired = counts.EXPIRED || 0;
    const deleted = counts.DELETED || 0;

    const knownTotal = active + disabled + created + expired + deleted;
    const other = Math.max(0, total - knownTotal);

    return {
      total,
      active,
      disabled,
      created,
      expired,
      deleted,
      other,
      generated_at: new Date().toISOString(),
    };
  }

  async getById(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'id', message: 'Invalid UUID format' }],
      });
    }
    const acc = await this.prisma.account.findUnique({ where: { id: id }, include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true } });
    if (!acc) throw new NotFoundException('Account not found');
    return this.formatAccount(acc as any);
  }

  private createValidationSchema() {
    return yup.object({
      username: yup.string().required('username is required').matches(USERNAME_REGEX, 'username format is invalid'),
      full_name: yup.string().required('full_name is required'),
      phone_number: yup.string().optional(),
      email: yup.string().email('email must be a valid email').optional(),
      attribute: yup.mixed().optional(),
      account_type: yup.mixed().required('account_type is required'),
      account_role: yup.mixed().required('account_role is required'),
      account_expiry_date: yup.date().optional().nullable(),
      password_expiry_time: yup.date().required('password_expiry_time is required'),
    });
  }

  private generatePassword(length = 16) {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const all = upper + lower + digits + SYMBOLS;

    let pwd = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    ];
    while (pwd.length < length) {
      pwd.push(all[Math.floor(Math.random() * all.length)]);
    }
    // shuffle
    pwd = pwd.sort(() => 0.5 - Math.random());
    return pwd.join('');
  }

  private async resolveLifecycle(code: string) {
    const lifecycle = await this.prisma.lookup.findFirst({
      where: { lookup_type: 'ACCOUNT_LIFECYCLE', code },
    });
    if (!lifecycle) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'account_lifecycle', message: `ACCOUNT_LIFECYCLE ${code} not seeded` }],
      });
    }
    return lifecycle;
  }

  private async resolveAccountType(account_type: string | number) {
    const id = typeof account_type === 'string' ? parseInt(account_type, 10) : account_type;
    const acctType = await this.prisma.lookup.findUnique({ where: { lookup_type: 'ACCOUNT_TYPE', id } });
    if (!acctType) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'account_type', message: 'account_type lookup not found' }],
      });
    }
    return acctType;
  }

  private async resolveAccountRole(account_role: string | number) {
    const id = typeof account_role === 'string' ? parseInt(account_role, 10) : account_role;
    const role = await this.prisma.lookup.findUnique({ where: { lookup_type: 'ACCOUNT_ROLE', id } });
    if (!role) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'account_role', message: 'account_role lookup not found' }],
      });
    }
    return role;
  }

  private async resolveAccountWithLookups(username: string) {
    return this.prisma.account.findUnique({
      where: { username },
      include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true },
    });
  }

  private formatAccount(acc: any) {
    if (!acc) return acc;
    const { password, account_lifecycle_lookup, account_type_lookup, account_role_lookup, ...rest } = acc as any;
    return {
      ...rest,
      account_lifecycle: account_lifecycle_lookup || null,
      account_type: account_type_lookup || null,
      account_role: account_role_lookup || null,
    };
  }

  private async expireIfNeeded(account: any) {
    if (account?.account_type_lookup?.code === 'WITH_EXPIRATION' && account.account_expiry_date) {
      if (new Date(account.account_expiry_date).getTime() <= Date.now()) {
        const expired = await this.resolveLifecycle('EXPIRED');
        await this.prisma.account.update({ where: { id: account.id }, data: { account_lifecycle: expired.id } });
        account.account_lifecycle = expired.id;
        account.account_lifecycle_lookup = expired;
      }
    }
    return account;
  }

  async add(data: any) {
    const schema = this.createValidationSchema();
    try {
      await schema.validate(data, { abortEarly: false });
    } catch (e) {
      throw new BadRequestException({ message: 'Validation failed', details: buildValidationDetails(e) });
    }

    // username unique check
    const existing = await this.prisma.account.findUnique({ where: { username: data.username } });
    if (existing) throw new ConflictException({
      message: 'Username already exists',
      details: [{ field: 'username', message: 'Username already exists' }],
    });

    // check account_type lookup exists
    const acctType = await this.resolveAccountType(data.account_type);

    // if account_role provided, check lookup exists
    if (data.account_role !== undefined && data.account_role !== null) {
      await this.resolveAccountRole(data.account_role);
    }

    // if type is WITH_EXPIRATION require account_expiry_date
    if (acctType.code === 'WITH_EXPIRATION' && !data.account_expiry_date) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'account_expiry_date', message: 'account_expiry_date is required for WITH_EXPIRATION accounts' }],
      });
    }
    if (acctType.code === 'PERMANENT' && data.account_expiry_date) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'account_expiry_date', message: 'account_expiry_date must be null for PERMANENT accounts' }],
      });
    }

    // system-generated initial password
    const generatedPassword = this.generatePassword();
    if (!PASSWORD_REGEX.test(generatedPassword)) {
      throw new BadRequestException({
        message: 'Password generation failed',
        details: [{ field: 'password', message: 'Failed to generate a valid initial password' }],
      });
    }
    const hashed = await bcrypt.hash(generatedPassword, 12);

    const payload: any = {
      username: data.username,
      password: hashed,
      full_name: data.full_name,
      phone_number: data.phone_number || null,
      email: data.email || null,
      attribute: data.attribute || null,
      account_type: typeof data.account_type === 'string' ? parseInt(data.account_type, 10) : data.account_type,
      account_role: data.account_role ? (typeof data.account_role === 'string' ? parseInt(data.account_role, 10) : data.account_role) : null,
      account_expiry_date: data.account_expiry_date ? new Date(data.account_expiry_date) : null,
      password_expiry_time: data.password_expiry_time ? new Date(data.password_expiry_time) : null,
      must_change_password: true,
      password_last_changed: null,
    };

    // initial lifecycle: CREATED
    const lifecycle = await this.resolveLifecycle('CREATED');
    payload.account_lifecycle = lifecycle.id;

    const created = await this.prisma.account.create({ data: payload });
    const acc = await this.prisma.account.findUnique({ where: { username: created.username }, include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true } });
    return { account: this.formatAccount(acc), initial_password: generatedPassword };
  }

  async login(username: string, password: string) {
    let acc = await this.resolveAccountWithLookups(username);
    if (!acc) throw new UnauthorizedException('Invalid credentials');

    acc = await this.expireIfNeeded(acc as any);

    if (acc.account_lifecycle_lookup?.code === 'DELETED') throw new NotFoundException('Account not found');
    if (acc.account_lifecycle_lookup?.code === 'DISABLED') throw new ForbiddenException('Account disabled');
    if (acc.account_lifecycle_lookup?.code === 'EXPIRED') throw new ForbiddenException('Account expired');

    if (acc.password_expiry_time && new Date(acc.password_expiry_time).getTime() <= Date.now()) {
      throw new ForbiddenException('Password expired');
    }

    const match = await bcrypt.compare(password, acc.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.account.update({ where: { id: acc.id }, data: { last_login_time: new Date() } });

    return this.formatAccount(acc);
  }

  async resetPassword(id: string, passwordExpiryTime: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'id', message: 'Invalid UUID format' }],
      });
    }
    const expiryDate = new Date(passwordExpiryTime);
    if (!passwordExpiryTime || isNaN(expiryDate.getTime())) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'password_expiry_time', message: 'password_expiry_time must be a valid ISO date' }],
      });
    }
    if (expiryDate.getTime() <= Date.now()) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'password_expiry_time', message: 'password_expiry_time must be in the future' }],
      });
    }
    const acc = await this.prisma.account.findUnique({ where: { id: id } });
    if (!acc) throw new NotFoundException('Account not found');
    if ((acc as any).account_lifecycle === (await this.resolveLifecycle('DELETED')).id) {
      throw new NotFoundException('Account not found');
    }
    const generatedPassword = this.generatePassword();
    if (!PASSWORD_REGEX.test(generatedPassword)) {
      throw new BadRequestException({
        message: 'Password generation failed',
        details: [{ field: 'password', message: 'Failed to generate a valid password' }],
      });
    }
    const hashed = await bcrypt.hash(generatedPassword, 12);
    const updateData: any = {
      password: hashed,
      must_change_password: true,
      password_last_changed: null,
      password_expiry_time: expiryDate,
    };

    const updatedAccount = await this.prisma.account.update({
      where: { id: id },
      data: updateData,
    });
    const freshAccount = await this.prisma.account.findUnique({ where: { id: updatedAccount.id }, include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true } });
    const expiryTime = new Date(updateData.password_expiry_time);
    const expiresInDays = Math.max(0, Math.ceil((expiryTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return {
      account: this.formatAccount(freshAccount),
      initial_password: generatedPassword,
      password_expiry_time: expiryTime.toISOString(),
      expires_in_days: expiresInDays,
    };
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'id', message: 'Invalid UUID format' }],
      });
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'newPassword', message: 'Password does not meet complexity rules' }],
      });
    }

    const acc = await this.prisma.account.findUnique({ where: { id: id } });
    if (!acc) throw new NotFoundException('Account not found');
    if ((acc as any).account_lifecycle === (await this.resolveLifecycle('DELETED')).id) {
      throw new NotFoundException('Account not found');
    }

    const currentMatch = await bcrypt.compare(currentPassword, acc.password);
    if (!currentMatch) throw new UnauthorizedException('Invalid current password');

    const hashed = await bcrypt.hash(newPassword, 12);
    const now = new Date();
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + PASSWORD_EXPIRY_MONTHS);

    const updateData: any = {
      password: hashed,
      must_change_password: false,
      password_last_changed: now,
      password_expiry_time: expiry,
    };

    const createdLifecycle = await this.resolveLifecycle('CREATED');
    if (acc.account_lifecycle === createdLifecycle.id) {
      const activeLifecycle = await this.resolveLifecycle('ACTIVE');
      updateData.account_lifecycle = activeLifecycle.id;
    }

    const updatedAccount = await this.prisma.account.update({
      where: { id: id },
      data: updateData,
    });
    const freshAccount = await this.prisma.account.findUnique({ where: { id: updatedAccount.id }, include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true } });
    return this.formatAccount(freshAccount);
  }

  async editAccount(id: string, data: any) {
    if (!uuidValidate(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'id', message: 'Invalid UUID format' }],
      });
    }

    const schema = yup.object({
      username: yup.string().matches(USERNAME_REGEX, 'username format is invalid').optional(),
      full_name: yup.string().optional(),
      phone_number: yup.string().nullable().optional(),
      email: yup.string().email('email must be a valid email').nullable().optional(),
      attribute: yup.mixed().nullable().optional(),
    });

    try {
      await schema.validate(data, { abortEarly: false });
    } catch (e) {
      throw new BadRequestException({ message: 'Validation failed', details: buildValidationDetails(e) });
    }

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'body', message: 'At least one field must be provided' }],
      });
    }

    const current = await this.prisma.account.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Account not found');
    if ((current as any).account_lifecycle === (await this.resolveLifecycle('DELETED')).id) {
      throw new NotFoundException('Account not found');
    }

    if (data.username) {
      const existing = await this.prisma.account.findUnique({ where: { username: data.username } });
      if (existing && existing.id !== id) {
        throw new ConflictException({
          message: 'Username already exists',
          details: [{ field: 'username', message: 'Username already exists' }],
        });
      }
    }

    const updateData: any = {};
    if (Object.prototype.hasOwnProperty.call(data, 'username')) updateData.username = data.username;
    if (Object.prototype.hasOwnProperty.call(data, 'full_name')) updateData.full_name = data.full_name;
    if (Object.prototype.hasOwnProperty.call(data, 'phone_number')) updateData.phone_number = data.phone_number;
    if (Object.prototype.hasOwnProperty.call(data, 'email')) updateData.email = data.email;
    if (Object.prototype.hasOwnProperty.call(data, 'attribute')) updateData.attribute = data.attribute;

    const updated = await this.prisma.account.update({ where: { id }, data: updateData });
    const acc = await this.prisma.account.findUnique({ where: { id: updated.id }, include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true } });
    return this.formatAccount(acc);
  }

  async editRole(id: string, roleLookupId: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'id', message: 'Invalid UUID format' }],
      });
    }
    const roleId = typeof roleLookupId === 'string' ? parseInt(roleLookupId, 10) : roleLookupId;
    const role = await this.prisma.lookup.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'roleLookupId', message: 'Role lookup not found' }],
      });
    }
    await this.prisma.account.update({ where: { id: id }, data: { account_role: roleId } });
    const acc = await this.prisma.account.findUnique({ where: { id }, include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true } });
    return this.formatAccount(acc);
  }

  async setLifecycle(id: string, lifecycleCode: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'id', message: 'Invalid UUID format' }],
      });
    }
    const lifecycle = await this.resolveLifecycle(lifecycleCode);
    await this.prisma.account.update({ where: { id: id }, data: { account_lifecycle: lifecycle.id } });
    const acc = await this.prisma.account.findUnique({ where: { id }, include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true } });
    return this.formatAccount(acc);
  }

  async softDelete(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'id', message: 'Invalid UUID format' }],
      });
    }
    return this.setLifecycle(id, 'DELETED');
  }

  async validateCookie(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [{ field: 'id', message: 'Invalid UUID format' }],
      });
    }
    const acc = await this.prisma.account.findUnique({
      where: { id },
      include: { account_lifecycle_lookup: true, account_type_lookup: true },
    });
    if (!acc) throw new UnauthorizedException('Invalid cookie');
    await this.expireIfNeeded(acc as any);
    if (acc.account_lifecycle_lookup?.code === 'DELETED') throw new UnauthorizedException('Invalid cookie');
    if (acc.account_lifecycle_lookup?.code === 'DISABLED') throw new UnauthorizedException('Invalid cookie');
    if (acc.account_lifecycle_lookup?.code === 'EXPIRED') throw new UnauthorizedException('Invalid cookie');
    const fresh = await this.prisma.account.findUnique({ where: { id }, include: { account_lifecycle_lookup: true, account_type_lookup: true, account_role_lookup: true } });
    return this.formatAccount(fresh);
  }
}
