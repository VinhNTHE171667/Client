import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }

  @Post('bulk')
  createMany(@Body() body: { feedbacks: CreateFeedbackDto[] }) {
    return this.feedbackService.createMany(body.feedbacks);
  }

  @Get()
  findAll() {
    return this.feedbackService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFeedbackDto) {
    return this.feedbackService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedbackService.remove(id);
  }

  @Get('appointment-detail/:appointmentDetailId')
  findByAppointmentDetail(
    @Param('appointmentDetailId') appointmentDetailId: string,
  ) {
    return this.feedbackService.findByAppointmentDetail(appointmentDetailId);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.feedbackService.findByCustomer(customerId);
  }

  @Get('appointment/:appointmentId')
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.feedbackService.findByAppointment(appointmentId);
  }

  @Patch(':id/approve')
  approveFeedback(@Param('id') id: string) {
    return this.feedbackService.approveFeedback(id);
  }

  @Patch(':id/reject')
  rejectFeedback(@Param('id') id: string) {
    return this.feedbackService.rejectFeedback(id);
  }
}
