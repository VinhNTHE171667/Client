import * as bcrypt from 'bcrypt';
import AppDataSource from '../db/data-source';
import dataSource from '../db/data-source';
import { Role } from '@/entities/role.entity';
import { Internal } from '@/entities/internal.entity';
import { Spa } from '@/entities/spa.entity';
import { Membership } from '@/entities/membership.entity';
import { DeepPartial } from 'typeorm';
import { CustomerType } from '@/entities/enums/customer-type.enum';

async function seedData() {
  await AppDataSource.initialize();

  const internalRepository = dataSource.getRepository(Internal);
  const roleRepository = dataSource.getRepository(Role);
  const spaRepository = dataSource.getRepository(Spa);
  const membershipRepository = dataSource.getRepository(Membership);

  const existingSpa = await spaRepository.findOneBy({});
  if (!existingSpa) {
    const spa = spaRepository.create({
      name: 'GenSpa',
      logo: 'https://res.cloudinary.com/dlf04wlnw/image/upload/v1762503338/Asset_4_300x-8_cvsoe9.png',
      address: '123 Tố Hữu, Hà Đông, Hà Nội',
      phone: '0901234567',
      email: 'genspa.systembusiness@gmail.com',
    });

    await spaRepository.save(spa);
    console.log('Spa seeded');
  } else {
    console.log('Spa already exists, skipping...');
  }

  const memberships: DeepPartial<Membership>[] = [
    {
      name: CustomerType.Regular,
      minSpent: 0,
      maxSpent: 9999999,
      discountPercent: 0,
    },
    {
      name: CustomerType.Member,
      minSpent: 10000000,
      maxSpent: 49999999,
      discountPercent: 5,
    },
    {
      name: CustomerType.Vip,
      minSpent: 50000000,
      maxSpent: undefined,
      discountPercent: 10,
    },
  ];

  for (const m of memberships) {
    const exists = await membershipRepository.findOne({
      where: { name: m.name },
    });
    if (!exists) {
      const membership = membershipRepository.create(m as Membership);
      await membershipRepository.save(membership);
      console.log(`Seeded membership: ${m.name}`);
    } else {
      console.log(`Membership ${m.name} already exists, skipping...`);
    }
  }

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
    avatar:
      'https://res.cloudinary.com/dlf04wlnw/image/upload/v1762503338/Asset_4_300x-8_cvsoe9.png',
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
