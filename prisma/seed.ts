import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

// removed user/post seeds — project now only seeds lookups and accounts

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing data (only lookup/account tables are relevant)
  // Seed lookups
  const lookups = [
    // ACCOUNT_LIFECYCLE
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'CREATED', label: 'Created', sort_order: 1 },
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'ACTIVE', label: 'Active', sort_order: 2 },
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'DISABLED', label: 'Disabled', sort_order: 3 },
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'EXPIRED', label: 'Expired', sort_order: 4 },
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'DELETED', label: 'Deleted', sort_order: 5 },
    // ACCOUNT_TYPE
    { lookup_type: 'ACCOUNT_TYPE', code: 'PERMANENT', label: 'Permanent', sort_order: 1 },
    { lookup_type: 'ACCOUNT_TYPE', code: 'WITH_EXPIRATION', label: 'With Expiration', sort_order: 2 },
    // ACCOUNT_ROLE
    { lookup_type: 'ACCOUNT_ROLE', code: 'OPERATOR', label: 'Operator', sort_order: 1 },
    { lookup_type: 'ACCOUNT_ROLE', code: 'ADMINISTRATOR', label: 'Administrator', sort_order: 2 },
    { lookup_type: 'ACCOUNT_ROLE', code: 'PPIC', label: 'PPIC', sort_order: 3 },
    { lookup_type: 'ACCOUNT_ROLE', code: 'MAINTENANCE', label: 'Maintenance', sort_order: 4 },
    { lookup_type: 'ACCOUNT_ROLE', code: 'MAINTENANCE_ADMINISTRATOR', label: 'Maintenance Administrator', sort_order: 5 },
    // JOB_PRIORITY
    { lookup_type: 'JOB_PRIORITY', code: 'HIGH', label: 'High', sort_order: 1 },
    { lookup_type: 'JOB_PRIORITY', code: 'MEDIUM', label: 'Medium', sort_order: 2 },
    { lookup_type: 'JOB_PRIORITY', code: 'LOW', label: 'Low', sort_order: 3 },
    // JOB_LIFECYCLE_STATE
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'SCHEDULED', label: 'Scheduled', sort_order: 1 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'RELEASED', label: 'Released', sort_order: 2 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'RUNNING', label: 'Running', sort_order: 3 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'SUSPENDED', label: 'Suspended', sort_order: 4 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'COMPLETED', label: 'Completed', sort_order: 5 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'CANCELLED', label: 'Cancelled', sort_order: 6 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'CLOSED', label: 'Closed', sort_order: 7 },
    // QUANTITY_UNIT
    { lookup_type: 'QUANTITY_UNIT', code: 'BK', label: 'BK', sort_order: 1 },
    { lookup_type: 'QUANTITY_UNIT', code: 'EA', label: 'EA', sort_order: 2 },
    // WORK_CENTER
    { lookup_type: 'WORK_CENTER', code: 'MACHINE_A', label: 'Machine A', sort_order: 1 },
    { lookup_type: 'WORK_CENTER', code: 'MACHINE_B', label: 'Machine B', sort_order: 2 },
  ];

  for (const l of lookups) {
    try {
      await prisma.lookup.upsert({
        where: { lookup_type_code: { lookup_type: l.lookup_type, code: l.code } },
        update: l,
        create: l,
      });
      console.log(`Upserted lookup ${l.lookup_type}:${l.code}`);
    } catch (err) {
      // If client doesn't generate a composite unique input name, fall back to try/catch create
      try {
        await prisma.lookup.create({ data: l });
        console.log(`Created lookup ${l.lookup_type}:${l.code}`);
      } catch (e) {
        console.error('Failed to create/upsert lookup', l, e);
      }
    }
  }

  // Seed accounts
  const lifecycleCreated = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'CREATED' },
  });
  const typePermanent = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_TYPE', code: 'PERMANENT' },
  });
  const typeWithExp = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_TYPE', code: 'WITH_EXPIRATION' },
  });
  const roleAdmin = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_ROLE', code: 'ADMINISTRATOR' },
  });
  const roleOperator = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_ROLE', code: 'OPERATOR' },
  });

  if (!lifecycleCreated || !typePermanent || !typeWithExp) {
    throw new Error('Required lookup seeds missing for account seeding');
  }

  const accountSeeds = [
    {
      username: 'admin_01',
      full_name: 'Administrator One',
      email: 'admin01@example.com',
      phone_number: '+628111111111',
      account_type: typePermanent.id,
      account_role: roleAdmin?.id ?? null,
      account_expiry_date: null,
    },
    {
      username: 'operator_01',
      full_name: 'Operator One',
      email: 'operator01@example.com',
      phone_number: '+628222222222',
      account_type: typeWithExp.id,
      account_role: roleOperator?.id ?? null,
      account_expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  ];

  for (const acc of accountSeeds) {
    const existing = await prisma.account.findUnique({ where: { username: acc.username } });
    if (existing) {
      console.log(`Account ${acc.username} already exists`);
      continue;
    }
    const initialPassword = 'TempPass!2345';
    const hashed = await bcrypt.hash(initialPassword, 12);
    const created = await prisma.account.create({
      data: {
        username: acc.username,
        password: hashed,
        full_name: acc.full_name,
        email: acc.email,
        phone_number: acc.phone_number,
        account_type: acc.account_type,
        account_role: acc.account_role,
        account_expiry_date: acc.account_expiry_date,
        account_lifecycle: lifecycleCreated.id,
        must_change_password: true,
        password_last_changed: null,
      },
    });
    console.log(`Created account ${created.username} with initial password: ${initialPassword}`);
  }
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
