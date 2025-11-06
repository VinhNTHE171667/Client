import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { default as hbs } from 'nodemailer-express-handlebars';
import { join } from 'path';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });

    this.transporter.use(
      'compile',
      hbs({
        viewEngine: {
          extname: '.hbs',
          partialsDir: join(__dirname, 'templates'),
          defaultLayout: false,
        },
        viewPath: join(__dirname, 'templates'),
        extName: '.hbs',
      }),
    );
  }

  async confirmAppointment({
    to,
    text,
    appointment,
  }: {
    to: string;
    text: string;
    appointment: {
      customer: { name: string };
      spa: { name: string; address: string };
      startTime: Date;
      service: { name: string };
      staff?: { name: string } | null;
    };
  }) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_USER'),
      to,
      subject: `Xác nhận lịch hẹn tại ${appointment.spa.name}`,
      template: 'appointment-confirmation',
      context: {
        customerName: appointment.customer.name,
        spaName: appointment.spa.name,
        startTime: appointment.startTime.toLocaleString(),
        serviceName: appointment.service.name,
        staffName: appointment.staff?.name || 'Đang cập nhật',
        spaAddress: appointment.spa.address,
      },
      text,
    });
  }

  async confirmInvoice({
    to,
    text,
    invoice,
  }: {
    to: string;
    text: string;
    invoice: {
      customerName: string;
      spaName: string;
      createdAt: Date;
      totalAmount: number;
      finalAmount: number;
      discountAmount?: number;
      details: {
        serviceName: string;
        quantity: number;
        price: number;
      }[];
    };
  }) {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);

    const detailsWithFormat = invoice.details.map((item) => ({
      ...item,
      priceFormatted: formatCurrency(item.price),
      totalFormatted: formatCurrency(item.price * item.quantity),
    }));

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_USER'),
      to,
      subject: `Hóa đơn dịch vụ từ ${invoice.spaName}`,
      template: 'invoice-confirmation',
      context: {
        customerName: invoice.customerName,
        spaName: invoice.spaName,
        createdAt: invoice.createdAt.toLocaleString(),
        totalAmountFormatted: formatCurrency(invoice.totalAmount),
        finalAmountFormatted: formatCurrency(invoice.finalAmount),
        discountAmountFormatted: invoice.discountAmount
          ? formatCurrency(invoice.discountAmount)
          : null,
        details: detailsWithFormat,
      },
      text,
    });
  }

  async notifySpaOfAppointment({
    to,
    text,
    appointment,
  }: {
    to: string;
    text: string;
    appointment: {
      customer: { name: string };
      spa: { name: string; address: string };
      startTime: Date;
      service: { name: string };
    };
  }) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_USER'),
      to,
      subject: `Khách hàng mới đặt lịch tại ${appointment.spa.name}`,
      template: 'appointment-from-customer',
      context: {
        customerName: appointment.customer.name,
        spaName: appointment.spa.name,
        startTime: appointment.startTime.toLocaleString(),
        serviceName: appointment.service.name,
        spaAddress: appointment.spa.address,
      },
      text,
    });
  }
}
