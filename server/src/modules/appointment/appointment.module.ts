import { Customer } from '@/entities/customer.entity';
import { Doctor } from '@/entities/doctor.entity';
import { Internal } from '@/entities/internal.entity';
import { Role } from '@/entities/role.entity';
import { Service } from '@/entities/service.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';
import { Appointment } from '@/entities/appointment.entity';
import { AppointmentHistory } from '@/entities/appointmentHistory.entity';
import { MailModule } from '../mail/mail.module';
import { Spa } from '@/entities/spa.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { Cart } from '@/entities/cart.entity';
import { CartDetail } from '@/entities/cartDetails.entity';
import { Voucher } from '@/entities/voucher.entity';
import { CustomerVoucher } from '@/entities/customerVoucher.entity';
import { Invoice } from '@/entities/invoice.entity';
import { InvoiceDetail } from '@/entities/invoiceDetail.entity';
import { AppointmentCronReminderService } from './appointment.cron';

@Module({
  imports: [
    CacheModule.register(),
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([
      Customer,
      Internal,
      Role,
      Doctor,
      Service,
      AppointmentDetail,
      Appointment,
      AppointmentHistory,
      Spa,
      Cart,
      CartDetail,
      Voucher,
      CustomerVoucher,
      Invoice,
      InvoiceDetail,
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.EXPIRE_TIME_ACCESS },
    }),
    MailModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentCronReminderService, AppointmentService],
})
export class AppointmentModule {}
