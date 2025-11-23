import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, In, Not, LessThan } from 'typeorm';
import { Appointment } from '@/entities/appointment.entity';
import { MailService } from '../mail/mail.service';
import { Doctor } from '@/entities/doctor.entity';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';
import { Service } from '@/entities/service.entity';
import { AppointmentStatus } from '@/entities/enums/appointment-status';
import { NotificationService } from '../notification/notification.service'; 
import { NotificationType } from '@/entities/enums/notification-type.enum';

@Injectable()
export class AppointmentCronReminderService {
  private readonly logger = new Logger(AppointmentCronReminderService.name);
  private isRunningAssign = false; // Lock to prevent duplicate runs

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AppointmentDetail)
    private readonly detailRepo: Repository<AppointmentDetail>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,

    private readonly mailService: MailService,
    private readonly notificationService: NotificationService, 
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendUpcomingAppointmentsReminder() {
    this.logger.log('Đang kiểm tra appointment sắp đến giờ...');

    const now = new Date();
    const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const appointments = await this.appointmentRepo.find({
      where: { startTime: MoreThan(now) },
      relations: ['customer', 'details', 'details.service', 'staff'],
    });

    if (!appointments.length) {
      this.logger.log('Không có appointment nào cần gửi thông báo');
      return;
    }

    for (const appt of appointments) {
      const startTime = new Date(appt.startTime);

      if (startTime <= next24h) {
        await this.mailService.remindUpcomingAppointment({
          to: appt.customer.email,
          text: `Xin chào ${appt.customer.full_name}, đây là nhắc nhở về lịch hẹn sắp tới tại GenSpa.`,
          appointment: {
            customer: { full_name: appt.customer.full_name },
            startTime: appt.startTime,
            services: appt.details.map((s) => ({
              name: s.service.name,
              price: s.price.toLocaleString('vi-VN') + '₫',
            })),
            staff: appt.staff ? { name: appt.staff.full_name } : null,
          },
        });

        await this.appointmentRepo.save(appt);

        this.logger.log(
          `Đã gửi email nhắc nhở cho khách: ${appt.customer.full_name}`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE) 
  async assignDoctorsToPendingAppointments() {
    if (this.isRunningAssign) { 
      this.logger.warn('Assign job is already running, skipping...');
      return;
    }

    this.isRunningAssign = true;
    this.logger.log('Bắt đầu quét và gán bác sĩ cho các lịch hẹn deposited...');

    try {
      const pendingAppointments = await this.appointmentRepo.find({
        where: { 
          status: AppointmentStatus.Deposited,
          doctorId: IsNull(),
        },
        relations: ['customer', 'details', 'details.service', 'details.service.doctors'], 
        take: 10, 
      });

      if (!pendingAppointments.length) {
        this.logger.log('Không có lịch hẹn đã đặt cọc nào cần gán bác sĩ');
        return;
      }

      for (const appt of pendingAppointments) {
        if (appt.doctorId) continue; 

        try {
          const serviceIds = appt.details.map(d => d.serviceId);
          if (!serviceIds.length) continue;

          const services = await this.serviceRepo.find({
            where: { id: In(serviceIds) },
            relations: ['doctors'],
          });

          const possibleDoctors = new Set<string>();
          services.forEach(service => {
            service.doctors.forEach(doctor => possibleDoctors.add(doctor.id));
          });

          if (possibleDoctors.size === 0) {
            this.logger.warn(`No doctors available for appointment ${appt.id} services`);
            continue;
          }

          const availableDoctors: string[] = [];
          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(appt.endTime);

          for (const doctorId of possibleDoctors) {
            const overlappingCount = await this.appointmentRepo.count({
              where: {
                doctorId,
                status: Not(AppointmentStatus.Cancelled), 
                startTime: LessThan(apptEnd),
                endTime: MoreThan(apptStart), 
              },
            });

            if (overlappingCount === 0) {
              availableDoctors.push(doctorId);
            }
          }

          if (availableDoctors.length === 0) {
            this.logger.warn(`No available doctors (no free slots) for appointment ${appt.id}`);
            continue;
          }

          const selectedDoctorId = availableDoctors[Math.floor(Math.random() * availableDoctors.length)];

          appt.doctorId = selectedDoctorId;
          await this.appointmentRepo.save(appt);

          const doctor = await this.doctorRepo.findOne({ where: { id: selectedDoctorId } });
          if (doctor) {
            await this.notificationService.create({
              title: 'Lịch hẹn của bạn đã được gán bác sĩ!',
              content: `Lịch hẹn của bạn đã được gán cho bác sĩ ${doctor.full_name} (Chuyên môn: ${doctor.specialization}). Thời gian: ${appt.startTime.toLocaleString('vi-VN')}.`,
              type: NotificationType.Success,
              userId: appt.customer.id,
              userType: 'customer',
              actionUrl: `/customer/orders`, 
              relatedId: appt.id,
              relatedType: 'appointment',
            });
          }

          this.logger.log(`Assigned doctor ${selectedDoctorId} to appointment ${appt.id}`);
        } catch (error) {
          this.logger.error(`Error assigning doctor to appointment ${appt.id}:`, error);
        }
      }
    } finally {
      this.isRunningAssign = false; 
    }
  }
}