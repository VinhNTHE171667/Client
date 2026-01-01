import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { Customer } from '@/entities/customer.entity';
import { hashPassword } from '@/common/utils/security';
import { RoleEnum, RoleType } from '@/common/types/role.enum';
import omit from 'lodash/omit';
import { Internal } from '@/entities/internal.entity';
import { Role } from '@/entities/role.entity';
import { Doctor } from '@/entities/doctor.entity';
import { CreateInternalDto, UpdateInternalDto } from './dto/internal.dto';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { Service } from '@/entities/service.entity';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(Internal)
    private internalRepository: Repository<Internal>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    private dataSource: DataSource,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async checkDuplicateEmailWithRole(email: string): Promise<RoleType | null> {
    const [customer, internal, doctor] = await Promise.all([
      this.customerRepository.findOne({ where: { email } }),
      this.internalRepository.findOne({
        where: { email },
        relations: ['role'],
      }),
      this.doctorRepository.findOne({ where: { email } }),
    ]);

    if (customer) return RoleEnum.Customer;
    if (doctor) return RoleEnum.Doctor;

    if (internal) {
      switch (internal.role.name) {
        case 'admin':
          return RoleEnum.Admin;
        case 'staff':
          return RoleEnum.Staff;
        case 'cashier':
          return RoleEnum.Cashier;
        default:
          return null;
      }
    }

    return null;
  }

  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    if (!data.email) {
      throw new HttpException(
        'Email cần được cung cấp',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingRole = await this.checkDuplicateEmailWithRole(data.email);
    if (existingRole) {
      throw new HttpException(`Email đã được sử dụng`, HttpStatus.CONFLICT);
    }

    console.log('Creating customer with data:', data);

    const customer = this.customerRepository.create(data);
    customer.password = await hashPassword(data.password);
    
    // Tạo token xác thực
    const verifyToken = await this.jwtService.signAsync(
      { email: customer.email },
      { 
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '24h' 
      },
    );

    const savedCustomer = await this.customerRepository.save({
      ...customer,
      refreshToken: '',
      isVerified: false,
      isEmailVerified: false,
      emailVerificationToken: verifyToken,
      emailVerificationTokenExpire: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Tạo URL xác thực
    const clientUrl = this.configService.get<string>('CLIENT_URL');
    const verifyUrl = `${clientUrl}/verify-email?token=${verifyToken}`;

    // Gửi email xác thực
    try {
      await this.mailService.sendVerifyEmail({
        to: savedCustomer.email,
        customerName: savedCustomer.full_name || savedCustomer.email,
        verifyUrl,
      });
      console.log('Đã gửi email xác thực đến:', savedCustomer.email);
    } catch (error) {
      console.error('Lỗi khi gửi email xác thực:', error);
      // Không throw error để không làm gián đoạn việc tạo tài khoản
    }

    return savedCustomer;
  }

  async findAllCustomers(): Promise<Customer[]> {
    const result = await this.customerRepository.find();
    return result.map((customer) =>
      omit(customer, ['refreshToken', 'password', 'address', 'isVerified']),
    );
  }

  async findOneCustomer(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<any> {
    if (data.email && data.email !== data.email) {
      const existingRole = await this.checkDuplicateEmailWithRole(data.email);
      if (existingRole) {
        throw new HttpException(
          `Email đã được sử dụng bởi role ${existingRole}`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const customer = await this.findOneCustomer(id);
    Object.assign(customer, data);

    this.customerRepository.save({
      ...customer,
      password: customer.password,
    });

    return {
      id: customer.id,
      email: customer.email,
      name: customer.full_name,
      role: RoleEnum.Customer,
      phone: customer.phone,
      spaId: null,
    };
  }

  async toggleCustomerActive(id: string): Promise<Customer> {
    const customer = await this.findOneCustomer(id);
    customer.isActive = !customer.isActive;
    return this.customerRepository.save(customer);
  }

  async removeCustomer(id: string): Promise<void> {
    const customer = await this.findOneCustomer(id);
    await this.customerRepository.remove(customer);
  }

  async updateCustomerPassword(data: {
    id: string;
    newPassword: string;
  }): Promise<Customer> {
    const customer = await this.findOneCustomer(data.id);
    customer.password = await hashPassword(data.newPassword);
    return this.customerRepository.save(customer);
  }

  //////////////////////////////////////////////

  async createInternal(data: CreateInternalDto): Promise<Internal> {
    const existingRole = await this.checkDuplicateEmailWithRole(data.email);
    if (existingRole) {
      throw new HttpException(`Email đã được sử dụng`, HttpStatus.CONFLICT);
    }

    const existingRoleEntity = await this.roleRepository.findOne({
      where: { id: Number(data.positionID) },
    });

    if (!existingRoleEntity || existingRoleEntity.name === 'admin') {
      throw new HttpException('Chức vụ không hợp lệ', HttpStatus.BAD_REQUEST);
    }

    const staff = this.internalRepository.create({
      ...data,
      password: await hashPassword(data.password),
      refreshToken: '',
      role: existingRoleEntity,
    });

    return this.internalRepository.save(staff);
  }

  async findAllInternals(): Promise<Internal[]> {
    const result = await this.internalRepository
      .createQueryBuilder('internal')
      .leftJoinAndSelect('internal.role', 'role')
      // .where('role.name != :roleName', { roleName: 'admin' })
      .getMany();

    return result;
  }

  async findOneInternal(id: string): Promise<Internal> {
    const staff = await this.internalRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!staff) throw new NotFoundException('Không tìm thấy nhân viên');
    return staff;
  }

  async updateInternal(id: string, data: UpdateInternalDto): Promise<Internal> {
    const staff = await this.findOneInternal(id);

    if (data.email && data.email !== staff.email) {
      const existingRole = await this.checkDuplicateEmailWithRole(data.email);
      if (existingRole) {
        throw new HttpException(`Email đã được sử dụng`, HttpStatus.CONFLICT);
      }
    }

    Object.assign(staff, data);
    return this.internalRepository.save(staff);
  }

  async toggleInternalActive(id: string): Promise<Internal> {
    const staff = await this.findOneInternal(id);
    staff.isActive = !staff.isActive;
    return this.internalRepository.save(staff);
  }

  async removeInternal(id: string): Promise<{ message: string }> {
    const staff = await this.internalRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!staff) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    if (staff.role.name === 'admin') {
      throw new HttpException(
        'Không thể xóa nhân viên này',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.internalRepository.softRemove(staff);

    return {
      message: `Đã xóa nhân viên "${staff.full_name}" thành công.`,
    };
  }

  async updateInternalPassword(data: {
    id: string;
    newPassword: string;
  }): Promise<Internal> {
    const staff = await this.findOneInternal(data.id);
    staff.password = await hashPassword(data.newPassword);
    return this.internalRepository.save(staff);
  }

  async findAllInternalRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  //////////////////////////////////////////////

  async createDoctor(data: CreateDoctorDto): Promise<Doctor> {
    const existingRole = await this.checkDuplicateEmailWithRole(data.email);
    if (existingRole) {
      throw new HttpException(`Email đã được sử dụng`, HttpStatus.CONFLICT);
    }

    const services = await this.serviceRepository.findByIds(
      data.serviceIds || [],
    );

    const doctor = this.doctorRepository.create({
      ...data,
      experience_years: Number(data.experience_years),
      password: await hashPassword(data.password),
      refreshToken: '',
      services,
    });

    return this.doctorRepository.save(doctor);
  }

  async findAllDoctors(): Promise<Doctor[]> {
    const doctors = await this.doctorRepository.find({
      relations: ['services'],
    });

    const doctorsEdited = doctors.map((doctor) => ({
      ...omit(doctor, ['password', 'refreshToken']),
      services: doctor.services.map((s) => ({
        id: s.id,
        name: s.name,
      })),
    }));

    return doctorsEdited;
  }

  async findOneDoctor(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['services'],
    });

    if (!doctor) throw new NotFoundException('Doctor not found');

    const doctorEdited = {
      ...omit(doctor, ['password', 'refreshToken']),
      services: doctor.services.map((s) => ({
        id: s.id,
        name: s.name,
        images: s.images,
        description: s.description,
        price: s.price,
      })),
    };

    return doctorEdited;
  }

  async updateDoctor(id: string, data: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['services'],
    });
    if (!doctor) throw new NotFoundException('Không tìm thấy bác sĩ');

    if (data.serviceIds) {
      const services = await this.serviceRepository.find({
        where: { id: In(data.serviceIds) },
      });
      doctor.services = services;
    }

    Object.assign(doctor, {
      ...data,
      experience_years: Number(data.experience_years),
    });

    return this.doctorRepository.save(doctor);
  }

  async removeDoctor(id: string): Promise<{ message: string }> {
    const doctor = await this.findOneDoctor(id);

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    await this.doctorRepository.softRemove(doctor);

    return {
      message: `Đã xóa bác sĩ "${doctor.full_name}" thành công.`,
    };
  }

  async updateDoctorPassword(data: {
    id: string;
    newPassword: string;
  }): Promise<Doctor> {
    const doctor = await this.findOneDoctor(data.id);
    doctor.password = await hashPassword(data.newPassword);
    return this.doctorRepository.save(doctor);
  }

  async toggleDoctorActive(id: string): Promise<Doctor> {
    const doctor = await this.findOneDoctor(id);
    doctor.isActive = !doctor.isActive;
    return this.doctorRepository.save(doctor);
  }

  async getPublicDoctorProfile(id: string): Promise<Doctor> {
    const doctor = await this.findOneDoctor(id);

    const doctorEdited = {
      ...omit(doctor, ['password', 'refreshToken']),
      services: doctor.services.map((s) => ({
        id: s.id,
        name: s.name,
        images: s.images,
        description: s.description,
        price: s.price,
      })),
    };

    return doctorEdited;
  }
}
