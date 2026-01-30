import { Injectable, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as yup from 'yup';
import * as bcrypt from 'bcrypt';

const USERNAME_REGEX = /^[a-z][a-z0-9_]{3,19}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=[\]{}|;:,.<>]{12,}$/;
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.account.findMany({
      select: {
        id: true,
        username: true,
        full_name: true,
        phone_number: true,
        email: true,
        attribute: true,
        account_type: true,
        account_role: true,
        account_expiry_date: true,
        password_last_changed: true,
        must_change_password: true,
        last_login_time: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getById(id: string) {
    const acc = await this.prisma.account.findUnique({ where: { id: id } });
    if (!acc) throw new NotFoundException('Account not found');
    // remove password
    // map as returned object
    const { password, ...rest } = acc as any;
    return rest;
  }

  private createValidationSchema() {
    return yup.object({
      username: yup.string().matches(USERNAME_REGEX).required(),
      full_name: yup.string().required(),
      phone_number: yup.string().optional(),
      email: yup.string().email().optional(),
      attribute: yup.mixed().optional(),
      account_type: yup.string().required(),
      account_role: yup.string().required(),
      account_expiry_date: yup.date().optional(),
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
    if (!lifecycle) throw new BadRequestException(`ACCOUNT_LIFECYCLE ${code} not seeded`);
    return lifecycle;
  }

  private async resolveAccountType(account_type: string) {
    const acctType = await this.prisma.lookup.findUnique({ where: { id: account_type } });
    if (!acctType) throw new BadRequestException('account_type lookup not found');
    return acctType;
  }

  private async resolveAccountWithLookups(username: string) {
    return this.prisma.account.findUnique({
      where: { username },
      include: { account_lifecycle_lookup: true, account_type_lookup: true },
    });
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
      await schema.validate(data);
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    // username unique check
    const existing = await this.prisma.account.findUnique({ where: { username: data.username } });
    if (existing) throw new BadRequestException('Username already exists');

    // check account_type lookup exists
    const acctType = await this.resolveAccountType(data.account_type);

    // if type is WITH_EXPIRATION require account_expiry_date
    if (acctType.code === 'WITH_EXPIRATION' && !data.account_expiry_date) {
      throw new BadRequestException('account_expiry_date is required for WITH_EXPIRATION accounts');
    }
    if (acctType.code === 'PERMANENT' && data.account_expiry_date) {
      throw new BadRequestException('account_expiry_date must be null for PERMANENT accounts');
    }

    // system-generated initial password
    const generatedPassword = this.generatePassword();
    if (!PASSWORD_REGEX.test(generatedPassword)) {
      throw new BadRequestException('Failed to generate a valid initial password');
    }
    const hashed = await bcrypt.hash(generatedPassword, 12);

    const payload: any = {
      username: data.username,
      password: hashed,
      full_name: data.full_name,
      phone_number: data.phone_number || null,
      email: data.email || null,
      attribute: data.attribute || null,
      account_type: data.account_type,
      account_role: data.account_role || null,
      account_expiry_date: data.account_expiry_date ? new Date(data.account_expiry_date) : null,
      must_change_password: true,
      password_last_changed: null,
    };

    // initial lifecycle: CREATED
    const lifecycle = await this.resolveLifecycle('CREATED');
    payload.account_lifecycle = lifecycle.id;

    const created = await this.prisma.account.create({ data: payload });
    const { password, ...rest } = created as any;
    return { account: rest, initial_password: generatedPassword };
  }

  async login(username: string, password: string) {
    let acc = await this.resolveAccountWithLookups(username);
    if (!acc) throw new UnauthorizedException('Invalid credentials');

    acc = await this.expireIfNeeded(acc as any);

    if (acc.account_lifecycle_lookup?.code === 'DELETED') throw new NotFoundException('Account not found');
    if (acc.account_lifecycle_lookup?.code === 'DISABLED') throw new ForbiddenException('Account disabled');
    if (acc.account_lifecycle_lookup?.code === 'EXPIRED') throw new ForbiddenException('Account expired');

    const match = await bcrypt.compare(password, acc.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.account.update({ where: { id: acc.id }, data: { last_login_time: new Date() } });

    const { password: _p, account_lifecycle_lookup, account_type_lookup, ...rest } = acc as any;
    return rest;
  }

  async resetPassword(id: string, newPassword: string) {
    if (!PASSWORD_REGEX.test(newPassword)) throw new BadRequestException('Password does not meet complexity rules');
    const acc = await this.prisma.account.findUnique({ where: { id: id } });
    if (!acc) throw new NotFoundException('Account not found');
    if ((acc as any).account_lifecycle === (await this.resolveLifecycle('DELETED')).id) {
      throw new NotFoundException('Account not found');
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    const updateData: any = {
      password: hashed,
      must_change_password: false,
      password_last_changed: new Date(),
    };

    // If CREATED -> ACTIVE after password change
    const createdLifecycle = await this.resolveLifecycle('CREATED');
    if (acc.account_lifecycle === createdLifecycle.id) {
      const activeLifecycle = await this.resolveLifecycle('ACTIVE');
      updateData.account_lifecycle = activeLifecycle.id;
    }

    const updated = await this.prisma.account.update({
      where: { id: id },
      data: updateData,
    });
    const { password, ...rest } = updated as any;
    return rest;
  }

  async editRole(id: string, roleLookupId: string) {
    const role = await this.prisma.lookup.findUnique({ where: { id: roleLookupId } });
    if (!role) throw new BadRequestException('Role lookup not found');
    const updated = await this.prisma.account.update({ where: { id: id }, data: { account_role: roleLookupId } });
    const { password, ...rest } = updated as any;
    return rest;
  }

  async setLifecycle(id: string, lifecycleCode: string) {
    const lifecycle = await this.resolveLifecycle(lifecycleCode);
    const updated = await this.prisma.account.update({ where: { id: id }, data: { account_lifecycle: lifecycle.id } });
    const { password, ...rest } = updated as any;
    return rest;
  }

  async softDelete(id: string) {
    return this.setLifecycle(id, 'DELETED');
  }

  async validateCookie(id: string) {
    const acc = await this.prisma.account.findUnique({
      where: { id },
      include: { account_lifecycle_lookup: true, account_type_lookup: true },
    });
    if (!acc) throw new UnauthorizedException('Invalid cookie');
    await this.expireIfNeeded(acc as any);
    if (acc.account_lifecycle_lookup?.code === 'DELETED') throw new UnauthorizedException('Invalid cookie');
    if (acc.account_lifecycle_lookup?.code === 'DISABLED') throw new UnauthorizedException('Invalid cookie');
    if (acc.account_lifecycle_lookup?.code === 'EXPIRED') throw new UnauthorizedException('Invalid cookie');

    const { password, account_lifecycle_lookup, account_type_lookup, ...rest } = acc as any;
    return rest;
  }
}
