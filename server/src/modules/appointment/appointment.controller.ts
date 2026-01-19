import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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

  @Get('/dashboard')
  getDashboard(@Query('year') year: number, @Query('month') month?: number) {
    return this.appointmentService.getDashboard({ year, month });
  }

  @Post('request-cancel')
  requestCancelBulk(
    @Body('appointmentIds') appointmentIds: string[],
    @Body('reason') reason: string,
    @Body('doctorId') doctorId: string,
  ) {
    return this.appointmentService.requestCancelByDoctorBulk(
      appointmentIds,
      doctorId,
      reason,
    );
  }

  @Post('/request-cancel/approve/:id')
  approveRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.approveRequest(id);
  }

  @Post('/request-cancel/reject/:id')
  rejectRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.rejectRequest(id);
  }

  @Get('/request-cancel/pending')
  getPending() {
    return this.appointmentService.findAllPending();
  }

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

  @Get('/refunded')
findRefundedAppointments() {
  return this.appointmentService.findRefundedAppointments();
}

@Get('/refunds')
findAllRefunds() {
  return this.appointmentService.findAllRefunds();
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
  confirm(@Param('id') id: string, @Body('id') staffId: string) {
    return this.appointmentService.confirmAppointment(id, staffId);
  }

  @Patch(':id/arrived')
  arrived(@Param('id') id: string, @Body('id') staffId: string) {
    return this.appointmentService.updateStatus(id, AppointmentStatus.Arrived);
  }

  @Patch(':id/in-service')
  inService(@Param('id') id: string) {
    return this.appointmentService.updateStatus(id, AppointmentStatus.InService);
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

  @Patch(':id/request-complete')
  async requestComplete(
    @Param('id') id: string,
    @Body('staffName') staffName: string,
  ) {
    if (!staffName) {
      throw new BadRequestException('Thiếu thông tin nhân viên');
    }
    return this.appointmentService.requestCompleteByStaff(id, staffName);
  }

  @Patch(':id/refund')
async refundAppointment(
  @Param('id') id: string,
  @Body() body: {
    refundAmount: number;
    refundMethod: 'cash' | 'qr' | 'card';
    refundReason?: string;
    staffId: string;
  },
) {
  if (!body.refundAmount || !body.refundMethod || !body.staffId) {
    throw new BadRequestException('Thiếu thông tin hoàn tiền');
  }
  return this.appointmentService.refundAppointment(id, {
    refundAmount: body.refundAmount,
    refundMethod: body.refundMethod,
    refundReason: body.refundReason,
    staffId: body.staffId,
  });
}


}
