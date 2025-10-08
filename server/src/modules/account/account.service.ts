import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { Customer } from '@/entities/customer.entity';
import { hashPassword } from '@/common/utils/security';
import { RoleEnum, RoleType } from '@/common/types/role.enum';
import omit from 'lodash/omit';
import { Internal } from '@/entities/internal.entity';
import { Role } from '@/entities/role.entity';
import { Doctor } from '@/entities/doctor.entity';

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

    private dataSource: DataSource,
    private jwtService: JwtService,
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
    return this.customerRepository.save({
      ...customer,
      refreshToken: '',
      isVerified: true,
    });
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
}
