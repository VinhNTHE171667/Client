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
import { Admin } from '@/entities/admin.entity';
import { hashPassword } from '@/common/utils/security';
import { RoleEnum, RoleType } from '@/common/types/role.enum';
import omit from 'lodash/omit';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,

    private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  async checkDuplicateEmailWithRole(email: string): Promise<RoleType | null> {
    const [customer, admin] = await Promise.all([
      this.customerRepository.findOne({ where: { email } }),
      this.adminRepository.findOne({ where: { username: email } }),
    ]);

    if (customer) return RoleEnum.Customer;
    if (admin) return RoleEnum.Admin;

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
