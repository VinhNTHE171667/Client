import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { cloudinary } from '@/utils/cloudinary';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '@/entities/customer.entity';
import { DataSource, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { hashPassword } from '@/common/utils/security';
import { RoleEnum, RoleType } from '@/common/types/role.enum';
import { ConfigService } from '@nestjs/config';
import { Internal } from '@/entities/internal.entity';
import { Role } from '@/entities/role.entity';
import { Doctor } from '@/entities/doctor.entity';
import {
  ChangePasswordDto,
  UpdateCustomerProfileDto,
} from './dto/customer.dto';
import { MailService } from '../mail/mail.service';
import { Spa } from '@/entities/spa.entity';
import { NotificationType } from '@/entities/enums/notification-type.enum';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AuthService {
  private spaInfo: Spa | null = null;
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(Internal)
    private internalRepository: Repository<Internal>,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Spa)
    private spaRepo: Repository<Spa>,

    private dataSource: DataSource,
    private configService: ConfigService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) {
    this.loadSpa();
  }

  private async loadSpa() {
    this.spaInfo = await this.spaRepo.findOne({ where: {} });
    // console.log('Spa info cached:', this.spaInfo?.name);
  }

  private async getSpa(): Promise<Spa | null> {
    if (!this.spaInfo) {
      this.spaInfo = await this.spaRepo.findOne({});
    }
    return this.spaInfo;
  }

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

  async checkDuplicatePhoneWithRole(phone: string): Promise<RoleType | null> {
    const [customer, internal, doctor] = await Promise.all([
      this.customerRepository.findOne({ where: { phone } }),
      this.internalRepository.findOne({ where: { phone } }),
      this.doctorRepository.findOne({ where: { phone } }),
    ]);

    if (customer) return RoleEnum.Customer;
    if (doctor) return RoleEnum.Doctor;

    if (internal) {
      const role = await this.internalRepository.findOne({
        where: { phone },
        relations: ['role'],
      });
      if (role && role.role) {
        switch (role.role.name) {
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
    }

    return null;
  }

  async generateToken(payload: { id: string; email: string; role: RoleType }) {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(
          { id: payload.id, role: payload.role },
          {
            expiresIn: (this.configService.get<string>('EXPIRE_TIME_ACCESS') || '1d') as any,
            secret: this.configService.get<string>('JWT_SECRET'),
          },
        ),
        this.jwtService.signAsync(
          { id: payload.id, role: payload.role },
          {
            expiresIn: (this.configService.get<string>('EXPIRE_TIME_REFRESH') || '7d') as any,
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

    if (customerData.phone) {
      const existingPhone = await this.checkDuplicatePhoneWithRole(customerData.phone);
      if (existingPhone) {
        throw new HttpException(`Số điện thoại đã được sử dụng`, HttpStatus.CONFLICT);
      }
    }

    const newCustomer = this.customerRepository.create(customerData);
    const savedCustomer = await this.customerRepository.save({
      ...newCustomer,
      password: await hashPassword(newCustomer.password),
      refreshToken: '',
      isEmailVerified: false,
    });

    await this.sendEmailVerification(savedCustomer);

    await this.notificationService.create({
      title: 'Chào mừng đến với GenSpa!',
      content: `Tài khoản của bạn đã được tạo thành công. Vui lòng kiểm tra email để xác minh và kích hoạt tài khoản.`,
      type: NotificationType.Success,
      userId: savedCustomer.id,
      userType: 'customer',
      actionUrl: `${this.configService.get<string>('CLIENT_URL')}/verify-email?token=${savedCustomer.emailVerificationToken}`,
    });

    return savedCustomer;
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

        if (source.roleResolver(user) === RoleEnum.Customer && !user.isEmailVerified) {
          throw new HttpException(
            'Tài khoản chưa được xác minh email. Vui lòng kiểm tra email để xác minh.',
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
          gender: user.gender || null,
          birthDate: user.birthDate || null,
          phone: user.phone || null,
          name: user.name || user.full_name,
          role,
          avatar: user.avatar || null,
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

  async findCustomerProfile(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['membership', 'cart'],
    });

    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...safe } = customer;
    return safe;
  }

  async updateCustomerProfile(id: string, dto: UpdateCustomerProfileDto) {
    const customer = await this.customerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== null) {
        (customer as any)[key] = value;
      }
    }

    await this.customerRepository.save(customer);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...safe } = customer;
    return safe;
  }

  // async updateCustomerAvatar(id: string, file: Express.Multer.File) {
  //   const customer = await this.customerRepository.findOne({
  //     where: { id, deletedAt: IsNull() },
  //   });

  //   if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');
  //   if (!file) throw new BadRequestException('Không có file upload');

  //   const uploaded = await this.uploadImagesToCloudinary([file]);
  //   customer.avatar = uploaded[0].url;

  //   const updated = await this.customerRepository.save(customer);
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { password, refreshToken, ...safe } = updated;
  //   return safe;
  // }

  async uploadImagesToCloudinary(
    files: Express.Multer.File[],
  ): Promise<{ url: string; alt?: string }[]> {
    const uploads = await Promise.all(
      files.map((file) => {
        return new Promise<{ url: string }>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: 'avatars' }, (error, result) => {
              if (error || !result)
                return reject(new Error('Lỗi khi tải lên hình ảnh'));
              resolve({ url: result.secure_url });
            })
            .end(file.buffer);
        });
      }),
    );
    return uploads;
  }

  async changePassword(id: string, role: RoleType, dto: ChangePasswordDto) {
    const repoMap: Record<RoleType, Repository<any>> = {
      [RoleEnum.Customer]: this.customerRepository,
      [RoleEnum.Admin]: this.internalRepository,
      [RoleEnum.Staff]: this.internalRepository,
      [RoleEnum.Cashier]: this.internalRepository,
      [RoleEnum.Doctor]: this.doctorRepository,
    };

    const repo = repoMap[role];
    if (!repo) throw new BadRequestException('Role không hợp lệ');

    const user = await repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không chính xác');

    const newHashed = await hashPassword(dto.newPassword);
    user.password = newHashed;

    await repo.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  async forgotPassword(email: string) {
    const user = await this.customerRepository.findOne({ where: { email } });
    if (!user)
      throw new NotFoundException('Email không tồn tại trong hệ thống');

    const now = new Date();
    if (user.resetTokenExpire && user.resetTokenExpire > now) {
      const minutesLeft = Math.ceil(
        (user.resetTokenExpire.getTime() - now.getTime()) / 60000,
      );
      throw new BadRequestException(
        `Vui lòng chờ ${minutesLeft} phút trước khi gửi lại.`,
      );
    }

    const token = await this.jwtService.signAsync(
      { email },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    user.resetToken = token;
    user.resetTokenExpire = new Date(Date.now() + 15 * 60 * 1000);
    await this.customerRepository.save(user);

    const resetLink = `${this.configService.get<string>('CLIENT_URL')}/reset-password?token=${token}`;

    await this.mailService.sendResetPasswordEmail({
      to: email,
      user: {
        full_name: user.full_name,
        email: user.email,
      },
      token,
      resetUrl: resetLink,
    });

    return { message: 'Đã gửi link đặt lại mật khẩu đến email của bạn.' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.customerRepository.findOne({
        where: { email: decoded.email },
      });

      if (!user || user.resetToken !== token) {
        throw new BadRequestException('Token không hợp lệ');
      }

      if (user.resetTokenExpire && user.resetTokenExpire < new Date()) {
        throw new BadRequestException('Token đã hết hạn');
      }

      user.password = await hashPassword(newPassword);
      user.resetToken = null;
      user.resetTokenExpire = null;
      await this.customerRepository.save(user);

      return { message: 'Đặt lại mật khẩu thành công' };
    } catch {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  async sendEmailVerification(customer: Customer) {
    const token = await this.jwtService.signAsync(
      { email: customer.email },
      { 
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '24h' 
      },
    );

    customer.emailVerificationToken = token;
    customer.emailVerificationTokenExpire = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );
    await this.customerRepository.save(customer);

    const verifyLink = `${this.configService.get<string>('CLIENT_URL')}/verify-email?token=${token}`;

    await this.mailService.sendVerifyEmail({
      to: customer.email,
      customerName: customer.full_name || 'Khách hàng',
      verifyUrl: verifyLink,
    });

    return { message: 'Đã gửi email xác thực, vui lòng kiểm tra hộp thư.' };
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Token không được để trống');

    const customer = await this.customerRepository.findOne({
      where: { emailVerificationToken: token },
    });
    if (!customer) throw new NotFoundException('Token không hợp lệ');

    if (
      !customer.emailVerificationTokenExpire ||
      customer.emailVerificationTokenExpire < new Date()
    ) {
      throw new BadRequestException('Token đã hết hạn');
    }

    customer.isEmailVerified = true;
    customer.isVerified = true;
    customer.emailVerificationToken = null;
    customer.emailVerificationTokenExpire = null;
    await this.customerRepository.save(customer);

    // Tạo thông báo sau khi xác minh email thành công
    await this.notificationService.create({
      title: 'Xác minh email thành công!',
      content: 'Email của bạn đã được xác minh. Bây giờ bạn có thể đăng nhập và sử dụng đầy đủ các tính năng của GenSpa.',
      type: NotificationType.Success,
      userId: customer.id,
      userType: 'customer',
    });

    return { message: 'Email đã được xác thực thành công' };
  }

  async findSpaProfile() {
    const spa = await this.getSpa();
    if (!spa) {
      throw new NotFoundException('Không tìm thấy thông tin spa');
    }

    return spa;
  }

  async updateSpaProfile(dto: Partial<Spa>, file?: Express.Multer.File) {
    const spa = await this.spaRepo.findOne({ where: {} });

    if (!spa) {
      throw new NotFoundException('Không tìm thấy thông tin Spa');
    }

    if (file) {
      const uploaded = await this.uploadImagesToCloudinary([file]);
      spa.logo = uploaded[0].url;
    }

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== null) {
        (spa as any)[key] = value;
      }
    }

    const updated = await this.spaRepo.save(spa);

    this.spaInfo = updated;

    return {
      message: 'Cập nhật thông tin Spa thành công',
      data: updated,
    };
  }

  async findStaffProfile(id: string) {
    const staff = await this.internalRepository.findOne({ where: { id } });
    if (!staff) throw new NotFoundException('Không tìm thấy nhân viên');
    return staff;
  }

  async updateStaffProfile(id: string, dto: Partial<Internal>) {
    const staff = await this.internalRepository.findOne({ where: { id } });
    if (!staff) throw new NotFoundException('Không tìm thấy nhân viên');

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== null) {
        (staff as any)[key] = value;
      }
    }

    const updated = await this.internalRepository.save(staff);
    return {
      message: 'Cập nhật thông tin nhân viên thành công',
      data: updated,
    };
  }

  async updateAvatarUniversal(
    id: string,
    role: RoleType,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file upload');

    const repoMap: Record<RoleType, Repository<any>> = {
      [RoleEnum.Customer]: this.customerRepository,
      [RoleEnum.Admin]: this.internalRepository,
      [RoleEnum.Staff]: this.internalRepository,
      [RoleEnum.Cashier]: this.internalRepository,
      [RoleEnum.Doctor]: this.doctorRepository,
    };

    const repo = repoMap[role];
    if (!repo) throw new BadRequestException('Role không hợp lệ');

    const user = await repo.findOne({
      where: { id, deletedAt: IsNull?.() },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const uploaded = await this.uploadImagesToCloudinary([file]);
    user.avatar = uploaded[0].url;

    const updated = await repo.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...safe } = updated;
    return safe;
  }

  async findDoctorProfile(id: string) {
    const doctor = await this.doctorRepository.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Không tìm thấy bác sĩ');
    return doctor;
  }
  

  async updateDoctorProfile(id: string, dto: Partial<Doctor>) {
    const doctor = await this.doctorRepository.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Không tìm thấy bác sĩ');

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== null) {
        (doctor as any)[key] = value;
      }
    }

    const updated = await this.doctorRepository.save(doctor);
    return {
      message: 'Cập nhật thông tin bác sĩ thành công',
      data: updated,
    };
  }
}