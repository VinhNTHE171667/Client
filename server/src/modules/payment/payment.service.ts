import { Appointment } from '@/entities/appointment.entity';
import { AppointmentStatus } from '@/entities/enums/appointment-status';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import PayOS from '@payos/node';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class PaymentService {
  private payos: PayOS;

  constructor(
    private configService: ConfigService,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {
    const apiKey = this.configService.get<string>('API_KEY_PAYMENT');
    const clientId = this.configService.get<string>('CLIENT_ID_PAYMENT');
    const checksumKey = this.configService.get<string>('CHECKSUM_KEY_PAYMENT');

    if (!apiKey || !clientId || !checksumKey) {
      throw new Error('Missing payment environment variables');
    }

    this.payos = new PayOS(clientId, apiKey, checksumKey);
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
      relations: ['details'],
    });
    if (!appointment) {
      throw new Error('Không tìm thấy lịch hẹn');
    }

    if (appointment.status === AppointmentStatus.Confirmed) {
      appointment.status = AppointmentStatus.Deposited;
      appointment.depositAmount =
        appointment.details.reduce(
          (sum, detail) => sum + detail.service.price,
          0,
        ) * 0.5;
      await this.appointmentRepo.save(appointment);
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
    });
    if (!appointment) {
      throw new Error('Không tìm thấy lịch hẹn');
    }

    if (appointment.status === AppointmentStatus.Completed) {
      appointment.status = AppointmentStatus.Paid;
      appointment.paymentMethod = 'qr';
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
