import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '@/entities/customer.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { hashPassword } from '@/common/utils/security';
import { RoleEnum, RoleType } from '@/common/types/role.enum';
import { ConfigService } from '@nestjs/config';
import { Internal } from '@/entities/internal.entity';
import { Role } from '@/entities/role.entity';
import { Doctor } from '@/entities/doctor.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(Internal)
    private internalRepository: Repository<Internal>,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    private dataSource: DataSource,
    private configService: ConfigService,
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
          updateRefreshToken(this.internalRepository, { email: payload.email }),

        [RoleEnum.Staff]: () =>
          updateRefreshToken(this.internalRepository, { email: payload.email }),

        [RoleEnum.Cashier]: () =>
          updateRefreshToken(this.internalRepository, { email: payload.email }),

        [RoleEnum.Doctor]: () =>
          updateRefreshToken(this.doctorRepository, { email: payload.email }),
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

      const [customer, internal, doctor] = await Promise.all([
        this.customerRepository.findOne({ where: { email } }),
        this.internalRepository.findOne({
          where: { email },
          relations: ['role'],
        }),
        this.doctorRepository.findOne({ where: { email } }),
      ]);

      let role: RoleType | null = null;
      let user: any = null;

      if (customer) {
        role = RoleEnum.Customer;
        user = customer;
      } else if (doctor) {
        role = RoleEnum.Doctor;
        user = doctor;
      } else if (internal) {
        const roleName = internal.role?.name?.toLowerCase();
        user = internal;

        switch (roleName) {
          case 'admin':
            role = RoleEnum.Admin;
            break;
          case 'staff':
            role = RoleEnum.Staff;
            break;
          case 'cashier':
            role = RoleEnum.Cashier;
            break;
          default:
            throw new HttpException(
              `Internal role "${roleName}" is not recognized.`,
              HttpStatus.FORBIDDEN,
            );
        }
      }

      if (!user || !role) {
        throw new HttpException(
          'Refresh token invalid or expired.',
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
        `Invalid refresh token: ${error.message}`,
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
      roleResolver: (user: any) => RoleType | null;
      passwordField: string;
    }[] = [
      {
        entity: this.internalRepository.findOne({
          where: { email },
          relations: ['role'],
        }),
        roleResolver: (user) => {
          const roleName = user?.role?.name?.toLowerCase();
          switch (roleName) {
            case 'admin':
              return RoleEnum.Admin;
            case 'staff':
              return RoleEnum.Staff;
            case 'cashier':
              return RoleEnum.Cashier;
            default:
              return null;
          }
        },
        passwordField: 'password',
      },
      {
        entity: this.customerRepository.findOne({ where: { email } }),
        roleResolver: () => RoleEnum.Customer,
        passwordField: 'password',
      },
      {
        entity: this.doctorRepository.findOne({ where: { email } }),
        roleResolver: () => RoleEnum.Doctor,
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
            'Tài khoản của bạn đã bị vô hiệu hóa.',
            HttpStatus.UNAUTHORIZED,
          );
        }

        const role = source.roleResolver(user);
        if (!role) {
          throw new HttpException(
            'Vai trò người dùng không đúng.',
            HttpStatus.FORBIDDEN,
          );
        }

        const { accessToken, refreshToken } = await this.generateToken({
          id: user.id,
          email: user.email,
          role,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.full_name,
          role,
          spaId: user.spaId || null,
          address: user.address || null,
          accessToken,
          refreshToken,
        };
      }
    }

    throw new HttpException(
      'Email hoặc mật khẩu không đúng',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
