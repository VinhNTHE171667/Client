import { Feedback } from '@/entities/feedback.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { FeedbackStatus } from '@/entities/enums/feedback-status';
import { Appointment } from '@/entities/appointment.entity';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AppointmentDetail)
    private readonly detailRepo: Repository<AppointmentDetail>,

    @InjectRepository(Feedback)
    private feedbackRepo: Repository<Feedback>,
  ) {}

  async create(dto: CreateFeedbackDto) {
    const feedback = this.feedbackRepo.create({
      ...dto,
      status: FeedbackStatus.Pending,
    });

    return this.feedbackRepo.save(feedback);
  }

  async createMany(feedbacks: CreateFeedbackDto[]) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: feedbacks[0].appointmentId },
    });

    if (appointment) {
      appointment.isFeedbackGiven = true;
      await this.appointmentRepo.save(appointment);
    } else {
      throw new NotFoundException('Appointment không tồn tại');
    }

    const entities = feedbacks.map((f) => {
      const feedback = this.feedbackRepo.create({
        ...f,
        status: FeedbackStatus.Pending,
      });
      return feedback;
    });

    return this.feedbackRepo.save(entities);
  }

  async findAll() {
    const feedbacks = await this.feedbackRepo.find({
      relations: ['customer', 'appointmentDetail'],
    });

    return feedbacks;
  }

  async findOne(id: string) {
    const feedback = await this.feedbackRepo.findOne({
      where: { id },
      relations: ['customer', 'appointmentDetail'],
    });
    if (!feedback) throw new NotFoundException('Feedback không tồn tại');
    return feedback;
  }

  async update(id: string, dto: UpdateFeedbackDto) {
    const feedback = await this.findOne(id);
    Object.assign(feedback, dto);
    return this.feedbackRepo.save(feedback);
  }

  async remove(id: string) {
    const feedback = await this.findOne(id);
    return this.feedbackRepo.remove(feedback);
  }

  async findByAppointmentDetail(appointmentDetailId: string) {
    return this.feedbackRepo.find({
      where: { id: appointmentDetailId, status: FeedbackStatus.Approved },
      relations: ['customer'],
    });
  }

  async findByAppointment(appointmentId: string) {
    return this.feedbackRepo.find({
      where: { appointmentId },
      select: ['id', 'rating', 'comment', 'status', 'createdAt', 'service'],
      relations: ['service'],
    });
  }

  async findByCustomer(customerId: string) {
    return this.feedbackRepo.find({
      where: { customerId },
      relations: ['appointmentDetail'],
    });
  }

  async approveFeedback(id: string) {
    const feedback = await this.findOne(id);
    feedback.status = FeedbackStatus.Approved;
    return this.feedbackRepo.save(feedback);
  }

  async rejectFeedback(id: string) {
    const feedback = await this.findOne(id);
    feedback.status = FeedbackStatus.Rejected;
    return this.feedbackRepo.save(feedback);
  }
}
