import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ALL_PERMS = [
  'can_view_dashboard',
  'can_view_transactions',
  'can_manage_transactions',
  'can_view_categories',
  'can_manage_categories',
  'can_manage_users',
  'can_export_reports',
  'can_view_audit_logs',
];

async function main() {
  console.log('🌱 Seeding UangKasir database...');

  // Create Superadmin
  const passwordHash = await bcrypt.hash('12345678', 10);
  const superadmin = await prisma.user.upsert({
    where: { userCode: 'USR001' },
    update: {},
    create: {
      id: 'usr_master_superadmin',
      name: 'Super Administrator',
      userCode: 'USR001',
      passwordHash,
      role: 'SUPERADMIN',
      isActive: true,
      permissions: ALL_PERMS,
    },
  });
  console.log(`✅ Superadmin created: ${superadmin.userCode} / 12345678`);

  // Seed default categories
  const categories = [
    { id: 'cat_penjualan', name: 'Penjualan Produk', type: 'INCOME' },
    { id: 'cat_jasa', name: 'Pendapatan Jasa', type: 'INCOME' },
    { id: 'cat_operasional', name: 'Biaya Operasional', type: 'EXPENSE' },
    { id: 'cat_gaji', name: 'Gaji Karyawan', type: 'EXPENSE' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: { id: cat.id, name: cat.name, type: cat.type },
    });
    console.log(`✅ Category: ${cat.name} (${cat.type})`);
  }

  console.log('\n🎉 Seeding complete!');
  console.log('Login: USR001 / 12345678');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
