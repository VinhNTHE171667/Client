import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Appointment } from '@/entities/appointment.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AppointmentCronReminderService {
  private readonly logger = new Logger(AppointmentCronReminderService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendUpcomingAppointmentsReminder() {
    this.logger.log('Đang kiểm tra appointment sắp đến giờ...');

    const now = new Date();
    const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const appointments = await this.appointmentRepo.find({
      where: { startTime: MoreThan(now) },
      relations: ['customer', 'services', 'staff', 'spa'],
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
}
