import 'dotenv/config';
import { PrismaClient, UserStatus } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});


const prisma = new PrismaClient({ adapter });

const ROLES = [
  'SYSTEM_ADMIN',
  'ELECTION_OFFICER',
  'VERIFICATION_OFFICER',
  'STUDENT',
  'AUDITOR',
  'OBSERVER',
] as const;

async function seedRoles(): Promise<Record<string, string>> {
  console.log('Seeding roles...');

  const roleMap: Record<string, string> = {};

  for (const roleName of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleMap[roleName] = role.id;
    console.log(`  ✔ Role: ${roleName}`);
  }

  return roleMap;
}

async function seedAdminUser(adminRoleId: string): Promise<void> {
  console.log('Seeding admin user...');

  const passwordHash = await bcrypt.hash('Carolyne@123', 12);

  await prisma.user.upsert({
    where: { email: 'carolyne@devs.com' },
    update: {},
    create: {
      email: 'carolyne@devs.com',
      fullName: 'Carolyne Admin',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleId: adminRoleId,
    },
  });

  console.log('  ✔ Admin user: carolyne@devs.com');
  console.log('  ✔ Password:   Carolyne@123');
  console.log('  ⚠  Change this password immediately after first login');
}

async function main(): Promise<void> {
  console.log('\n Starting SEVS database seed...\n');

  const roleMap = await seedRoles();
  await seedAdminUser(roleMap['SYSTEM_ADMIN']);

  console.log('\n Seed complete\n');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });