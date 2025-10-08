import * as bcrypt from 'bcrypt';
import AppDataSource from '../db/data-source';
import dataSource from '../db/data-source';
import { Role } from '@/entities/role.entity';
import { Internal } from '@/entities/internal.entity';

async function seedData() {
  await AppDataSource.initialize();

  const internalRepository = dataSource.getRepository(Internal);
  const roleRepository = dataSource.getRepository(Role);

  const roles = [
    { name: 'admin', description: 'System administrator' },
    { name: 'staff', description: 'Staff member or technician' },
    { name: 'cashier', description: 'Cashier / front desk staff' },
  ];

  for (const role of roles) {
    const exists = await roleRepository.findOne({ where: { name: role.name } });
    if (!exists) {
      await roleRepository.save(role);
      console.log(`Seeded role: ${role.name}`);
    } else {
      console.log(`Role ${role.name} already exists, skipping...`);
    }
  }

  const existingAdmin = await internalRepository.findOne({
    where: { email: 'admin_ne@system.com' },
  });
  if (existingAdmin) {
    console.log('Admin account already exists, skipping...');
    return;
  }

  const adminRole = await roleRepository.findOne({ where: { name: 'admin' } });

  const password = await bcrypt.hash('admin', 11);

  const admin = internalRepository.create({
    email: 'admin_ne@system.com',
    full_name: 'Super Admin',
    password,
    refreshToken: '',
    role: adminRole!,
  });

  await internalRepository.save(admin);

  console.log('Admin seeded');
  await AppDataSource.destroy();
}

seedData().catch((err) => {
  console.error('Error seeding data:', err);
  AppDataSource.destroy();
});
