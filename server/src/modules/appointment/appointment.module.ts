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

@Module({
  imports: [
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
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.EXPIRE_TIME_ACCESS },
    }),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
