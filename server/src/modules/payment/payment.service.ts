import { Appointment } from '@/entities/appointment.entity';
import { AppointmentStatus } from '@/entities/enums/appointment-status';
import { Internal } from '@/entities/internal.entity';
import { Spa } from '@/entities/spa.entity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import PayOS from '@payos/node';
import { Repository } from 'typeorm/repository/Repository';
import { MailService } from '../mail/mail.service';
import { Doctor } from '@/entities/doctor.entity';

@Injectable()
export class PaymentService {
  private spaInfo: Spa | null = null;
  private payos: PayOS;

  constructor(
    private configService: ConfigService,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(Spa)
    private readonly spaRepo: Repository<Spa>,

    @InjectRepository(Internal)
    private readonly internalRepo: Repository<Internal>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    private readonly mailService: MailService,
  ) {
    const apiKey = this.configService.get<string>('API_KEY_PAYMENT');
    const clientId = this.configService.get<string>('CLIENT_ID_PAYMENT');
    const checksumKey = this.configService.get<string>('CHECKSUM_KEY_PAYMENT');

    if (!apiKey || !clientId || !checksumKey) {
      throw new Error('Missing payment environment variables');
    }

    this.payos = new PayOS(clientId, apiKey, checksumKey);

    this.loadSpa();
  }

  private async loadSpa() {
    this.spaInfo = await this.spaRepo.findOne({ where: {} });
    // console.log('Spa info cached:', this.spaInfo?.name);
  }

  private async getSpa(): Promise<Spa | null> {
    if (!this.spaInfo) {
      this.spaInfo = await this.spaRepo.findOne({});
    }
    return this.spaInfo;
  }

  async createPaymentLink(order: {
    orderCode: number;
    amount: number;
    description: string;
    cancelUrl: string;
    returnUrl: string;
  }) {
    const paymentLinkRes = await this.payos.createPaymentLink(order);

    if (!paymentLinkRes || !paymentLinkRes.checkoutUrl) {
      throw new Error('Failed to create payment link');
    }

    // const invoice = this.invoiceRepo.create({
    //   orderCode: order.orderCode.toString(),
    //   amount: order.amount,
    //   description: order.description,
    //   paymentLink: paymentLinkRes.checkoutUrl,
    //   status: 'PENDING',
    //   spaId: order.spaId,
    //   ...(order.membershipId ? { membershipId: order.membershipId } : {}),
    // });

    // await this.invoiceRepo.save(invoice);
    return paymentLinkRes;
  }

  async updatePaymentStatusDeposited(body: { orderCode: string }) {
    const appointment = await this.appointmentRepo.findOne({
      where: { orderCode: parseInt(body.orderCode, 10) },
      relations: ['details', 'details.service', 'customer', 'staff'],
    });

    if (!appointment) {
      throw new Error('Không tìm thấy lịch hẹn');
    }

    if (appointment.status === AppointmentStatus.Confirmed) {
      const staff = await this.internalRepo.findOne({
        where: { id: appointment.staffId },
      });

      const services = appointment.details.map((d) => ({
        name: d.service.name,
        price: d.price ?? d.service.price ?? 0,
      }));

      const servicesWithFormat = services.map((s) => ({
        name: s.name,
        price: new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(Number(s.price)),
      }));
      const spa = await this.getSpa();

      appointment.status = AppointmentStatus.Deposited;
      appointment.depositAmount =
        appointment.details.reduce(
          (sum, detail) => sum + detail.service.price,
          0,
        ) * 0.5;

      await this.appointmentRepo.save(appointment);

      await this.mailService.confirmAppointmentDeposit({
        to: appointment.customer.email,
        text: 'Xác nhận đặt cọc lịch hẹn',
        appointment: {
          customer: { full_name: appointment.customer.full_name },
          startTime: appointment.startTime,
          services: servicesWithFormat,
          staff: { full_name: staff ? staff.full_name : 'Đang cập nhật' },
          address: spa?.address || 'Đang cập nhật',
          depositAmount: new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(Number(appointment.depositAmount)),
        },
      });
    } else {
      throw new Error(
        'Trạng thái lịch hẹn không hợp lệ để cập nhật thanh toán',
      );
    }

    // const invoice = await this.invoiceRepo.findOne({
    //   where: { orderCode: body.orderCode },
    // });
    // if (!invoice) {
    //   throw new Error('Không tìm thấy hóa đơn');
    // }
    // if (body.status !== 'PAID' && body.status !== 'CANCELLED') {
    //   throw new Error('Trạng thái không hợp lệ');
    // }
    // if (invoice.status !== 'PENDING') {
    //   throw new Error('Hóa đơn đã được cập nhật trước đó');
    // }
    // if (body.status === 'PAID') {
    //   const [spa, spaMembership] = await Promise.all([
    //     this.spaRepository.findOne({ where: { id: invoice.spaId } }),
    //     this.spaMembershipRepository.findOne({
    //       where: { id: invoice.membershipId },
    //     }),
    //   ]);
    //   if (spa) {
    //     if (spaMembership && spaMembership.id) {
    //       spa.membershipId = spaMembership.id;
    //       await this.spaRepository.save(spa);
    //     } else {
    //       throw new Error('Không tìm thấy gói thành viên spa');
    //     }
    //   } else {
    //     throw new Error('Không tìm thấy spa liên kết với hóa đơn');
    //   }
    // }
    // invoice.status = body.status;
    // await this.invoiceRepo.save(invoice);
  }

  async updatePaymentStatusPaid(body: { orderCode: string }) {
    const appointment = await this.appointmentRepo.findOne({
      where: { orderCode: parseInt(body.orderCode, 10) },
      relations: ['details', 'details.service', 'customer', 'staff'],
    });

    if (!appointment) {
      throw new Error('Không tìm thấy lịch hẹn');
    }

    if (appointment.status === AppointmentStatus.Completed) {
      // const staff = await this.internalRepo.findOne({
      //   where: { id: appointment.staffId },
      // });

      const doctor = await this.doctorRepo.findOne({
        where: { id: appointment.doctorId },
      });

      const services = appointment.details.map((d) => ({
        name: d.service.name,
        price: d.price ?? d.service.price ?? 0,
      }));

      const servicesWithFormat = services.map((s) => ({
        name: s.name,
        price: new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(Number(s.price)),
      }));
      const spa = await this.getSpa();

      appointment.status = AppointmentStatus.Paid;
      appointment.paymentMethod = 'qr';

      await this.mailService.sendThankYouForUsingServiceEmail({
        to: appointment.customer.email,
        customerName: appointment.customer.full_name,
        services: servicesWithFormat,
        usedDate: appointment.startTime.toLocaleDateString('vi-VN'),
        specialistName: doctor?.full_name || 'Đang cập nhật',
        spaName: spa?.name || 'Đang cập nhật',
        spaHotline: spa?.phone || '1900 1234',
        feedbackUrl: `${this.configService.get<string>(
          'FRONTEND_URL',
        )}/feedback?appointmentId=${appointment.id}`,
      });

      return await this.appointmentRepo.save(appointment);
    } else {
      throw new Error(
        'Trạng thái lịch hẹn không hợp lệ để cập nhật thanh toán',
      );
    }
  }

  // async processWebhook(body: any) {
  //   const { orderCode, status } = body;
  //   const invoice = await this.invoiceRepo.findOne({ where: { orderCode } });

  //   if (!invoice) {
  //     console.warn(
  //       `Webhook received but no invoice found for orderCode: ${orderCode}`,
  //     );
  //     return;
  //   }

  //   if (status === 'PAID') {
  //     invoice.status = 'PAID';
  //     await this.invoiceRepo.save(invoice);
  //   } else if (status === 'CANCELLED' || status === 'FAILED') {
  //     invoice.status = status;
  //     await this.invoiceRepo.save(invoice);
  //   }
  // }
}
