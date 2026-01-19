import { Customer } from '@/entities/customer.entity';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { Internal } from '@/entities/internal.entity';
import { Role } from '@/entities/role.entity';
import { Doctor } from '@/entities/doctor.entity';
import { MailModule } from '../mail/mail.module';
import { Spa } from '@/entities/spa.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { NotificationModule } from '../notification/notification.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.register(),
    TypeOrmModule.forFeature([Customer, Internal, Doctor, Role, Spa]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.EXPIRE_TIME_ACCESS || '1d') as any },
    }),
    MailModule,
    NotificationModule, 
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}