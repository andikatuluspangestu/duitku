import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Simple Finance database...');

  const adminPassword = await bcrypt.hash('admin12345', 10);
  const userPassword = await bcrypt.hash('user12345', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@simplefinance.com' },
    update: {},
    create: {
      name: 'Kepala Kasir (Admin)',
      email: 'admin@simplefinance.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@simplefinance.com' },
    update: {},
    create: {
      name: 'Anggota Transparansi (User)',
      email: 'user@simplefinance.com',
      password: userPassword,
      role: 'USER',
      isActive: true,
    },
  });

  console.log('Seed users created successfully:', { admin: admin.email, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
