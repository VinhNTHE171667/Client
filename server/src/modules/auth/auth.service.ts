import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '@/entities/customer.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Admin } from '@/entities/admin.entity';
import { JwtService } from '@nestjs/jwt';
import { hashPassword } from '@/common/utils/security';
import { RoleEnum, RoleType } from '@/common/types/role.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,

    private dataSource: DataSource,
    private configService: ConfigService,
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

  async generateToken(payload: { id: string; email: string; role: RoleType }) {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(
          { id: payload.id, role: payload.role },
          {
            expiresIn: this.configService.get<string>('EXPIRE_TIME_ACCESS'),
            secret: this.configService.get<string>('JWT_SECRET'),
          },
        ),
        this.jwtService.signAsync(
          { id: payload.id, role: payload.role },
          {
            expiresIn: this.configService.get<string>('EXPIRE_TIME_REFRESH'),
            secret: this.configService.get<string>('JWT_SECRET'),
          },
        ),
      ]);

      const updateRefreshToken = async (
        repo: Repository<any>,
        where: object,
      ) => {
        await repo.update(where, { refreshToken });
      };

      const updateMap: Record<RoleType, () => Promise<void>> = {
        [RoleEnum.Customer]: () =>
          updateRefreshToken(this.customerRepository, { email: payload.email }),
        [RoleEnum.Admin]: () =>
          updateRefreshToken(this.adminRepository, { username: payload.email }),
      };

      const updateFn = updateMap[payload.role];
      if (updateFn) await updateFn();

      return { accessToken, refreshToken };
    } catch (error) {
      throw new HttpException(
        'Error generating token: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const { email } = await this.jwtService.verifyAsync(refreshToken, {
        secret,
      });

      const rolesCheck = await Promise.all([
        this.customerRepository.findOne({ where: { email } }),
        this.adminRepository.findOne({ where: { username: email } }),
      ]);

      const [customer, admin] = rolesCheck;

      const user = customer ?? admin;

      const role: RoleType | null = customer
        ? RoleEnum.Customer
        : admin
          ? RoleEnum.Admin
          : null;

      if (!user || !role) {
        throw new HttpException(
          'Mã thông báo làm mới không hợp lệ hoặc đã hết hạn',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return this.generateToken({
        id: user.id,
        email,
        role,
      });
    } catch (error) {
      throw new HttpException(
        `Mã thông báo làm mới không hợp lệ: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async registerCustomer(customerData: Partial<Customer>): Promise<Customer> {
    if (!customerData.email) {
      throw new HttpException(
        'Email cần được cung cấp',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingRole = await this.checkDuplicateEmailWithRole(
      customerData.email,
    );
    if (existingRole) {
      throw new HttpException(`Email đã được sử dụng`, HttpStatus.CONFLICT);
    }

    const newCustomer = this.customerRepository.create(customerData);
    return await this.customerRepository.save({
      ...newCustomer,
      password: await hashPassword(newCustomer.password),
      refreshToken: '',
    });
  }

  async login(data: LoginDto): Promise<any> {
    const { email, password } = data;

    const loginSources: {
      entity: Promise<any>;
      role: RoleType;
      compareEmailField: 'email' | 'username';
      passwordField: string;
    }[] = [
      {
        entity: this.adminRepository.findOne({ where: { username: email } }),
        role: RoleEnum.Admin,
        compareEmailField: 'username',
        passwordField: 'password',
      },
      {
        entity: this.customerRepository.findOne({ where: { email } }),
        role: RoleEnum.Customer,
        compareEmailField: 'email',
        passwordField: 'password',
      },
    ];

    for (const source of loginSources) {
      const user = await source.entity;

      if (
        user &&
        (await bcrypt.compare(password, user[source.passwordField]))
      ) {
        if (!user.isActive) {
          throw new HttpException(
            'Tài khoản của bạn đã bị vô hiệu hóa',
            HttpStatus.UNAUTHORIZED,
          );
        }

        const { accessToken, refreshToken } = await this.generateToken({
          id: user.id,
          email: user[source.compareEmailField],
          role: source.role,
        });

        return {
          id: user.id,
          email: user.email || user.username,
          name: user.name || user.full_name,
          role: source.role,
          spaId: user.spaId || null,
          address: user.address || null,
          accessToken,
          refreshToken,
        };
      }
    }

    throw new HttpException(
      'Mật khẩu hoặc email không đúng',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
