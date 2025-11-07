import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointment/appointment.dto';
import { AppointmentStatus } from '@/entities/enums/appointment-status';
// import { get } from 'http';

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('/customer')
  findAll(@Query('customerId') customerId: string) {
    return this.appointmentService.findByCustomer(customerId);
  }

  @Get('/doctor-schedule-booked')
  findAllForDoctor(@Query('doctorId') doctorId: string) {
    return this.appointmentService.findAllAppointmentsBooked(doctorId);
  }

  @Get('/doctor-schedule-managed')
  findAllManagedForDoctor(@Query('doctorId') doctorId: string) {
    return this.appointmentService.findAllAppointmentsManaged(doctorId);
  }

  @Get('/customer-schedule-booked')
  findAllBookedForCustomer(@Query('customerId') customerId: string) {
    return this.appointmentService.findAllAppointmentsBookedByCustomer(
      customerId,
    );
  }

  @Get('/management')
  findAllForManagement() {
    return this.appointmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    if (!dto.customerId || !dto.details?.length) {
      throw new BadRequestException('Thiếu thông tin đặt lịch');
    }
    return this.appointmentService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentService.update(id, dto);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Body() staff: { id: string }) {
    return this.appointmentService.confirmAppointment(id, staff.id);
  }

  @Patch(':id/completed')
  complete(@Param('id') id: string) {
    return this.appointmentService.updateStatus(
      id,
      AppointmentStatus.Completed,
    );
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.appointmentService.updateStatus(id, AppointmentStatus.Approved);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.appointmentService.reject(id, reason);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.appointmentService.cancel(id, reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentService.remove(id);
  }
}
