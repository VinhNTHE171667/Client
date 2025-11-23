// src/modules/appointment/appointment.module.ts (Updated with VoucherModule import)
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
import { DoctorCancelRequest } from '@/entities/doctorCancelRequest.entity';
import { Customer } from '@/entities/customer.entity';
import { Internal } from '@/entities/internal.entity';
import { Role } from '@/entities/role.entity';
import { Doctor } from '@/entities/doctor.entity';
import { Service } from '@/entities/service.entity';
import { VoucherModule } from '../voucher/voucher.module';
import { NotificationModule } from '../notification/notification.module'; 

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
      DoctorCancelRequest,
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.EXPIRE_TIME_ACCESS },
    }),
    MailModule,
    VoucherModule,
    NotificationModule, 
  ],
  controllers: [AppointmentController],
  providers: [AppointmentCronReminderService, AppointmentService],
})
export class AppointmentModule {}