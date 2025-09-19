import { Admin } from '../entities/admin.entity';
import * as bcrypt from 'bcrypt';
import AppDataSource from '../db/data-source';

async function seedAdmin() {
  await AppDataSource.initialize();

  const adminRepo = AppDataSource.getRepository(Admin);

  const existing = await adminRepo.findOne({ where: { username: 'admin' } });
  if (existing) {
    console.log('Admin already exists');
    return;
  }

  const password = await bcrypt.hash('admin', 11);

  await adminRepo.save({
    username: 'admin',
    full_name: 'Super Admin',
    password,
    refreshToken: '',
  });

  console.log('✅ Admin seeded');
  await AppDataSource.destroy();
}

seedAdmin().catch((err) => {
  console.error('❌ Error seeding admin:', err);
  AppDataSource.destroy();
});
