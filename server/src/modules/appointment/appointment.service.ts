import { Appointment } from '@/entities/appointment.entity';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { In, Repository } from 'typeorm';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointment/appointment.dto';
import { Service } from '@/entities/service.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AppointmentDetail)
    private readonly detailRepo: Repository<AppointmentDetail>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async findAll() {
    const appointments = await this.appointmentRepo.find({
      relations: ['customer', 'doctor', 'details', 'details.service'],
    });
    console.log(appointments);
    return appointments;
  }

  findAllAppointmentsManaged(doctorId: string) {
    return this.appointmentRepo.find({
      where: { doctorId },
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
    const serviceIds = dto.details.map((d) => d.serviceId);

    const services = await this.serviceRepo.findBy({
      id: In(serviceIds),
    });

    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Một hoặc nhiều dịch vụ không hợp lệ');
    }

    const appointment = this.appointmentRepo.create({
      ...dto,
      status: 'pending',
      details: dto.details.map((d) => ({
        ...d,
      })),
    });

    const saved = await this.appointmentRepo.save(appointment);

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.appointmentRepo.update(id, dto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: Appointment['status']) {
    const appointment = await this.findOne(id);
    appointment.status = status;
    await this.appointmentRepo.save(appointment);
    return appointment;
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
