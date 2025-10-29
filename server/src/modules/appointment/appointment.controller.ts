import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointment/appointment.dto';
// import { get } from 'http';

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    if (customerId) {
      return this.appointmentService.findByCustomer(customerId);
    }
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentService.update(id, dto);
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
