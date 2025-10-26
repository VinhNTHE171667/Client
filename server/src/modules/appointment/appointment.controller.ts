import { Controller, Get } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
// import { get } from 'http';

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('/')
  getAppointments() {
    // return this.appointmentService.getAppointments();
  }
}
