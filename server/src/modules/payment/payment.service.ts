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
import { Invoice } from '@/entities/invoice.entity';
import { InvoiceDetail } from '@/entities/invoiceDetail.entity';
import { PaymentStatsDto } from './dto/payment-stats.dto'; 
import { Between, LessThanOrEqual, MoreThan } from 'typeorm';

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

    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,

    @InjectRepository(InvoiceDetail)
    private readonly invoiceDetailRepo: Repository<InvoiceDetail>,

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

    if (appointment.status !== AppointmentStatus.Confirmed) {
      throw new Error(
        'Trạng thái lịch hẹn không hợp lệ để cập nhật thanh toán',
      );
    }

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

    const invoiceDetails = appointment.details.map((d) => ({
      serviceId: d.serviceId,
      price: d.price ?? d.service.price ?? 0,
      quantity: 1,
    }));

    appointment.status = AppointmentStatus.Deposited;
    // appointment.depositAmount =
    //   appointment.details.reduce(
    //     (sum, detail) => sum + detail.service.price,
    //     0,
    //   ) * 0.5;
    appointment.depositAmount = appointment.totalAmount * 0.5;
    const total = invoiceDetails.reduce(
      (sum, d) => sum + Number(d.price) * d.quantity,
      0,
    );
    const discount = total - appointment.totalAmount;

    const invoice = this.invoiceRepo.create({
      customerId: appointment.customerId,
      appointmentId: appointment.id,
      total_amount: appointment.totalAmount * 0.5,
      total,
      discount: discount * 0.5,
      finalAmount: (total - discount) * 0.5,
      status: 'completed',
      payment_status: 'paid',
      invoice_type: 'deposit',
      payment_method: "qr",
      voucherId: appointment.voucherId ?? undefined,
      details: invoiceDetails,
    });

    await this.invoiceRepo.save(invoice);

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

    return appointment;
  }

  async updatePaymentStatusPaid(body: { orderCode: string, paymentMethod: string,
      staffId: string }) {
    const appointment = await this.appointmentRepo.findOne({
      where: { orderCode: parseInt(body.orderCode, 10) },
      relations: ['details', 'details.service', 'customer', 'staff'],
    });

    if (!appointment) {
      throw new Error('Không tìm thấy lịch hẹn');
    }

    if (appointment.status !== AppointmentStatus.Completed) {
      throw new Error(
        'Trạng thái lịch hẹn không hợp lệ để cập nhật thanh toán',
      );
    }

    const doctor = await this.doctorRepo.findOne({
      where: { id: appointment.doctorId },
    });

    const services = appointment.details.map((d) => ({
      name: d.service.name,
      price: d.price ?? d.service.price ?? 0,
    }));

    const services2 = appointment.details.map((d) => ({
      serviceId: d.service.id,
      name: d.service.name,
      price: d.price ?? d.service.price ?? 0,
      quantity: 1,
    }));

    const invoiceDetails = services2.map((s) => ({
      serviceId: s.serviceId,
      price: s.price,
      quantity: 1,
    }));

    const total = invoiceDetails.reduce(
      (sum, d) => sum + Number(d.price) * d.quantity,
      0,
    );
    const discount = total - appointment.totalAmount;

    const invoice = this.invoiceRepo.create({
      customer: appointment.customer,
      appointmentId: appointment.id,
      total_amount: appointment.totalAmount * 0.5,
      total: total,
      discount: discount * 0.5,
      finalAmount: appointment.totalAmount * 0.5,
      status: 'completed',
      payment_status: 'paid',
      invoice_type: 'final',
      payment_method: body.paymentMethod,
      voucherId: appointment.voucherId ?? undefined,
      details: invoiceDetails,
      cashierId: body.staffId
    });

    await this.invoiceRepo.save(invoice);

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

 async getPaymentStats(dto: PaymentStatsDto) {
  const { fromDate, toDate } = dto;
  const whereClause: any = {};

  if (fromDate) {
    whereClause.createdAt = fromDate ? MoreThan(fromDate) : undefined;
  }
  if (toDate) {
    whereClause.createdAt = whereClause.createdAt 
      ? Between(fromDate, toDate) 
      : LessThanOrEqual(toDate);
  }
  if (!fromDate && !toDate) {
    whereClause.createdAt = MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Default last 30 days
  }

  // Total cash vs transfer
  const [cashStats, transferStats] = await Promise.all([
    this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('SUM(invoice.finalAmount)', 'totalCash')
      .where('invoice.payment_method = :method', { method: 'cash' })
      .andWhere(whereClause)
      .getRawOne(),
    this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('SUM(invoice.finalAmount)', 'totalTransfer')
      .where('invoice.payment_method = :method', { method: 'qr' })
      .andWhere(whereClause)
      .getRawOne(),
  ]);

  const totalCash = parseFloat(cashStats?.totalCash || '0');
  const totalTransfer = parseFloat(transferStats?.totalTransfer || '0');
  const totalCollected = totalCash + totalTransfer;

  // Per cashier totals - Fix: Use 'cashier.full_name' not 'invoice.cashier.full_name'
  const cashierStats = await this.invoiceRepo
    .createQueryBuilder('invoice')
    .leftJoinAndSelect('invoice.cashier', 'cashier')
    .select('invoice.cashierId', 'cashierId')
    .addSelect('cashier.full_name', 'cashierName') // Fix: cashier.full_name
    .addSelect('SUM(invoice.finalAmount)', 'totalPerCashier')
    .where(whereClause)
    .andWhere('invoice.cashierId IS NOT NULL')
    .groupBy('invoice.cashierId, cashier.full_name') // Fix: group by cashier.full_name
    .getRawMany();

  const cashiers = cashierStats.map((stat) => ({
    cashierId: stat.cashierId,
    name: stat.cashierName,
    total: parseFloat(stat.totalPerCashier || '0'),
  }));

  // Null cashier
  const nullCashierTotal = await this.invoiceRepo
    .createQueryBuilder('invoice')
    .select('SUM(invoice.finalAmount)', 'totalNullCashier')
    .where(whereClause)
    .andWhere('invoice.cashierId IS NULL')
    .getRawOne();

  if (parseFloat(nullCashierTotal?.totalNullCashier || '0') > 0) {
    cashiers.unshift({
      cashierId: null,
      name: 'Không có thu ngân',
      total: parseFloat(nullCashierTotal?.totalNullCashier || '0'),
    });
  }

  return {
    totalCash,
    totalTransfer,
    totalCollected,
    cashiers,
    fromDate: fromDate || null,
    toDate: toDate || null,
    countInvoices: await this.invoiceRepo.count({ where: whereClause }),
  };
}

  async getInvoices() {
    return this.invoiceRepo.find({
      relations: ['customer', 'appointment', 'details', 'details.service', 'cashier'],
      order: { createdAt: 'DESC' },
    });
  }
}
