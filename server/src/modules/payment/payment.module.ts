import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '@/entities/customer.entity';
import { Appointment } from '@/entities/appointment.entity';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';
import { Internal } from '@/entities/internal.entity';
import { Service } from '@/entities/service.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { MailModule } from '../mail/mail.module';
import { Spa } from '@/entities/spa.entity';
import { Doctor } from '@/entities/doctor.entity';
import { Invoice } from '@/entities/invoice.entity';
import { InvoiceDetail } from '@/entities/invoiceDetail.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.register(),
    TypeOrmModule.forFeature([
      Customer,
      Appointment,
      AppointmentDetail,
      Internal,
      Service,
      Spa,
      Doctor,
      Invoice,
      InvoiceDetail,
    ]),
    MailModule,
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule {}
