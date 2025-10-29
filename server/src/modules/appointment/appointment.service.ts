import { Appointment } from '@/entities/appointment.entity';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointment/appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(AppointmentDetail)
    private readonly detailRepo: Repository<AppointmentDetail>,
  ) {}

  findAll() {
    return this.appointmentRepo.find({
      relations: ['customer', 'doctor', 'details', 'details.service'],
    });
  }

  findByCustomer(customerId: string) {
    return this.appointmentRepo.find({
      where: { customerId },
      relations: ['doctor', 'details', 'details.service'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['customer', 'doctor', 'details', 'details.service'],
    });
    if (!appointment) throw new NotFoundException('Không tìm thấy lịch hẹn');
    return appointment;
  }

  async create(dto: CreateAppointmentDto) {
    const appointment = this.appointmentRepo.create({
      ...dto,
      status: 'pending',
    });
    const saved = await this.appointmentRepo.save(appointment);

    const details = dto.details.map((d) =>
      this.detailRepo.create({
        ...d,
        appointmentId: saved.id,
      }),
    );
    await this.detailRepo.save(details);

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.appointmentRepo.update(id, dto);
    return this.findOne(id);
  }

  async cancel(id: string, reason: string) {
    const appointment = await this.findOne(id);
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    appointment.cancelReason = reason;
    await this.appointmentRepo.save(appointment);
    return appointment;
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    await this.appointmentRepo.softRemove(appointment);
    return { message: 'Đã xoá lịch hẹn' };
  }
}
