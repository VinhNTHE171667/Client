import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, In, Not, LessThan, Between } from 'typeorm';
import { Appointment } from '@/entities/appointment.entity';
import { MailService } from '../mail/mail.service';
import { Doctor } from '@/entities/doctor.entity';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';
import { Service } from '@/entities/service.entity';
import { AppointmentStatus } from '@/entities/enums/appointment-status';
import { NotificationService } from '../notification/notification.service'; 
import { NotificationType } from '@/entities/enums/notification-type.enum';
import { Voucher } from '@/entities/voucher.entity';
import { CustomerVoucher } from '@/entities/customerVoucher.entity';

@Injectable()
export class AppointmentCronReminderService {
  private readonly logger = new Logger(AppointmentCronReminderService.name);
  private isRunningAssign = false; 
  private isRunningOverdue = false; 
  private isRunningVoucherCheck = false;
  private isRunningDepositTimeout = false;

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AppointmentDetail)
    private readonly detailRepo: Repository<AppointmentDetail>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,

    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,

    @InjectRepository(CustomerVoucher)
    private readonly customerVoucherRepo: Repository<CustomerVoucher>,

    private readonly mailService: MailService,
    private readonly notificationService: NotificationService, 
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendUpcomingAppointmentsReminder() {
    this.logger.log('Đang kiểm tra appointment sắp đến giờ...');

    const now = new Date();
    const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Fix: Only query appointments within the next 24 hours to optimize
    const appointments = await this.appointmentRepo.find({
      where: { 
        startTime: Between(now, next24h) 
      },
      relations: ['customer', 'details', 'details.service', 'staff'],
    });

    if (!appointments.length) {
      this.logger.log('Không có appointment nào cần gửi thông báo');
      return;
    }

    for (const appt of appointments) {
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

      // Save to update timestamps (e.g., updatedAt)
      await this.appointmentRepo.save(appt);

      this.logger.log(
        `Đã gửi email nhắc nhở cho khách: ${appt.customer.full_name}`,
      );
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

          const services = appt.details.map(d => d.service).filter(Boolean);
          const possibleDoctors = new Set<string>();
          services.forEach(service => {
            if (service && service.doctors) {
              service.doctors.forEach(doctor => possibleDoctors.add(doctor.id));
            }
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

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndUpdateOverdueAppointments() {
    if (this.isRunningOverdue) {
      this.logger.warn('Overdue check job is already running, skipping...');
      return;
    }

    this.isRunningOverdue = true;
    this.logger.log('Đang kiểm tra các lịch hẹn quá hạn...');

    try {
      const now = new Date();

      const statusesToCheck = [
        AppointmentStatus.Pending,
        AppointmentStatus.Confirmed,
        AppointmentStatus.Deposited,
        AppointmentStatus.Approved,
      ];

     const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const overdueAppointments = await this.appointmentRepo.find({
        where: { 
          status: In(statusesToCheck),
          startTime: LessThan(twoHoursAgo),
        },
        relations: ['customer'],
        take: 50, 
      });


      if (!overdueAppointments.length) {
        this.logger.log('Không có lịch hẹn nào quá hạn');
        return;
      }

      for (const appt of overdueAppointments) {
        if (
          statusesToCheck.includes(appt.status) &&
          new Date(appt.startTime) < now
        ) {
          appt.status = AppointmentStatus.Overdue;
          await this.appointmentRepo.save(appt);
          await this.notificationService.create({
            title: 'Lịch hẹn của bạn đã quá hạn!',
            content: `Lịch hẹn của bạn vào lúc ${appt.startTime.toLocaleString('vi-VN')} đã quá thời gian bắt đầu và được chuyển sang trạng thái quá hạn. Vui lòng đặt lịch mới nếu cần.`,
            type: NotificationType.Warning, 
            userId: appt.customer.id,
            userType: 'customer',
            actionUrl: `/customer/orders`, 
            relatedId: appt.id,
            relatedType: 'appointment',
          });

          this.logger.log(`Đã cập nhật lịch hẹn ${appt.id} sang trạng thái Overdue cho khách ${appt.customer.full_name}`);
        }
      }
    } finally {
      this.isRunningOverdue = false;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndCancelExpiredVoucherAppointments() {
    if (this.isRunningVoucherCheck) {
      this.logger.warn('Voucher expiry check job is already running, skipping...');
      return;
    }

    this.isRunningVoucherCheck = true;
    this.logger.log('Đang kiểm tra các lịch hẹn với voucher hết hạn...');

    try {
      const now = new Date();

      const statusesToCheck = [
        AppointmentStatus.Pending,
        AppointmentStatus.Confirmed,
      ];

      const appointmentsWithVoucher = await this.appointmentRepo.find({
        where: { 
          status: In(statusesToCheck),
          voucherId: Not(IsNull()),
        },
        relations: ['customer'],
        take: 50, 
      });

      if (!appointmentsWithVoucher.length) {
        this.logger.log('Không có lịch hẹn nào sử dụng voucher cần kiểm tra');
        return;
      }

      for (const appt of appointmentsWithVoucher) {
        if (!statusesToCheck.includes(appt.status)) continue;

        const voucher = await this.voucherRepo.findOne({
          where: { id: appt.voucherId },
        });

        if (!voucher || !voucher.validTo || voucher.validTo >= now) continue;

        appt.status = AppointmentStatus.Cancelled;
        appt.cancelledAt = now;
        appt.cancelReason = 'Voucher đã hết hạn';

        await this.appointmentRepo.save(appt);

        const customerVoucher = await this.customerVoucherRepo.findOne({
          where: {
            customerId: appt.customerId,
            voucherId: appt.voucherId,
            isUsed: true,
          },
        });

        if (customerVoucher) {
          customerVoucher.isUsed = false;
          customerVoucher.usedAt = undefined;
          await this.customerVoucherRepo.save(customerVoucher);
        }

        // Notify customer
        await this.notificationService.create({
          title: 'Lịch hẹn của bạn đã bị hủy do voucher hết hạn',
          content: `Lịch hẹn của bạn vào lúc ${appt.startTime.toLocaleString('vi-VN')} đã bị hủy vì voucher sử dụng đã hết hạn. Voucher đã được khôi phục để bạn có thể sử dụng lại.`,
          type: NotificationType.Warning,
          userId: appt.customer.id,
          userType: 'customer',
          actionUrl: `/customer/orders`, 
          relatedId: appt.id,
          relatedType: 'appointment',
        });

        this.logger.log(`Đã hủy lịch hẹn ${appt.id} do voucher hết hạn cho khách ${appt.customer.full_name}`);
      }
    } finally {
      this.isRunningVoucherCheck = false;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndCancelUnpaidConfirmedAppointments() {
    if (this.isRunningDepositTimeout) {
      this.logger.warn('Deposit timeout check job is already running, skipping...');
      return;
    }

    this.isRunningDepositTimeout = true;
    this.logger.log('Đang kiểm tra các lịch hẹn Confirmed chưa đặt cọc sau 5 phút...');

    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const confirmedAppointments = await this.appointmentRepo.find({
        where: { 
          status: AppointmentStatus.Confirmed,
          depositAmount: 0,
          createdAt: LessThan(fiveMinutesAgo),
        },
        relations: ['customer'],
        take: 50, 
      });

      if (!confirmedAppointments.length) {
        this.logger.log('Không có lịch hẹn Confirmed nào cần hủy do chưa đặt cọc');
        return;
      }

      for (const appt of confirmedAppointments) {
        appt.status = AppointmentStatus.Cancelled;
        appt.cancelledAt = now;
        appt.cancelReason = 'Chưa đặt cọc sau 5 phút xác nhận';

        await this.appointmentRepo.save(appt);

        await this.notificationService.create({
          title: 'Lịch hẹn của bạn đã bị hủy do chưa đặt cọc',
          content: `Lịch hẹn của bạn vào lúc ${appt.startTime.toLocaleString('vi-VN')} đã bị hủy vì chưa đặt cọc sau 5 phút xác nhận. Vui lòng đặt lịch mới nếu cần.`,
          type: NotificationType.Warning,
          userId: appt.customer.id,
          userType: 'customer',
          actionUrl: `/customer/orders`, 
          relatedId: appt.id,
          relatedType: 'appointment',
        });

        this.logger.log(`Đã hủy lịch hẹn ${appt.id} do chưa đặt cọc sau 5 phút cho khách ${appt.customer.full_name}`);
      }
    } finally {
      this.isRunningDepositTimeout = false;
    }
  }
}