import { Appointment } from '@/entities/appointment.entity';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { In, Repository, Not, MoreThan, DataSource } from 'typeorm';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointment/appointment.dto';
import { Service } from '@/entities/service.entity';
import { AppointmentStatus } from '@/entities/enums/appointment-status';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AppointmentDetail)
    private readonly detailRepo: Repository<AppointmentDetail>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,

    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    const appointments = await this.appointmentRepo.find({
      relations: ['customer', 'doctor', 'details', 'details.service'],
      order: { createdAt: 'DESC' },
    });
    return appointments;
  }

  findAllAppointmentsManaged(doctorId: string) {
    return this.appointmentRepo.find({
      where: { doctorId },
      relations: ['customer', 'doctor', 'details', 'details.service'],
    });
  }

  async findAllAppointmentsBooked(doctorId: string) {
    const now = new Date();

    return this.appointmentRepo.find({
      where: {
        doctorId,
        status: Not(AppointmentStatus.Cancelled),
        appointment_date: MoreThan(now),
      },
      select: ['id', 'startTime', 'endTime', 'status'],
    });
  }

  findByCustomer(customerId: string) {
    return this.appointmentRepo.find({
      where: { customerId },
      relations: ['doctor', 'details', 'details.service', 'customer'],
      order: { appointment_date: 'ASC' },
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
      status: AppointmentStatus.Pending,
      details: dto.details.map((d) => ({
        ...d,
      })),

      totalAmount: services.reduce((sum, service) => sum + service.price, 0),
    });

    const saved = await this.appointmentRepo.save(appointment);

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const original = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['details'],
    });

    if (!original) {
      throw new NotFoundException('Lịch hẹn không tồn tại');
    }

    // if (original.status !== AppointmentStatus.Pending) {
    //   throw new BadRequestException('Không thể cập nhật lịch hẹn đã xác nhận');
    // }

    Object.assign(original, dto);

    return await this.dataSource.transaction(async (manager) => {
      const appointmentRepo = manager.getRepository(Appointment);
      const detailRepo = manager.getRepository(AppointmentDetail);
      const serviceRepo = manager.getRepository(Service);

      const managedAppointment = await appointmentRepo.findOne({
        where: { id },
      });
      if (!managedAppointment) {
        throw new NotFoundException('Lịch hẹn không tồn tại (transaction)');
      }

      await detailRepo
        .createQueryBuilder()
        .delete()
        .from(AppointmentDetail)
        .where('appointmentId = :id', { id })
        .execute();

      let totalAmount = 0;
      if (dto.details && dto.details.length) {
        const newDetails: AppointmentDetail[] = [];
        for (const d of dto.details) {
          const service = await serviceRepo.findOne({
            where: { id: d.serviceId },
          });
          if (!service) {
            throw new BadRequestException(
              `Dịch vụ với ID ${d.serviceId} không tồn tại`,
            );
          }

          const price = d.price ?? service.price ?? 0;
          totalAmount += price;

          const detail = detailRepo.create({
            ...d,
            price,
            service,
            appointment: managedAppointment,
          });
          newDetails.push(detail);
        }

        await detailRepo.save(newDetails);
      }

      Object.assign(managedAppointment, {
        ...dto,
        details: undefined,
        totalAmount: totalAmount,
      });

      return await appointmentRepo.save(managedAppointment);
    });
  }

  async reschedule(id: string, newDate: Date) {
    const appointment = await this.findOne(id);
    appointment.appointment_date = newDate;
    await this.appointmentRepo.save(appointment);
    return appointment;
  }

  async updateStatus(id: string, status: Appointment['status']) {
    const appointment = await this.findOne(id);
    appointment.status = status;
    await this.appointmentRepo.save(appointment);
    return appointment;
  }

  async cancel(id: string, reason: string) {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.Cancelled;
    appointment.cancelledAt = new Date();
    appointment.cancelReason = reason;
    await this.appointmentRepo.save(appointment);
    return appointment;
  }

  async reject(id: string, reason: string) {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.Rejected;
    appointment.rejectionReason = reason;
    await this.appointmentRepo.save(appointment);
    return appointment;
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    await this.appointmentRepo.softRemove(appointment);
    return { message: 'Đã xoá lịch hẹn' };
  }
}
