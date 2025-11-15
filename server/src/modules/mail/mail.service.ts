import { Voucher } from '@/entities/voucher.entity';
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
      customer: { full_name: string };
      startTime: Date;
      services: {
        name: string;
        price: string;
      }[];
      staff?: { name: string } | null;
      address: string;
    };
  }) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_USER'),
      to,
      subject: `Xác nhận lịch hẹn tại GenSpa`,
      template: 'appointment-confirmation',
      context: {
        customerName: appointment.customer.full_name,
        startTime: appointment.startTime.toLocaleString(),
        services: appointment.services,
        staffName: appointment.staff?.name || 'Đang cập nhật',
        spaAddress: appointment.address,
      },
      text,
    });
  }

  async confirmAppointmentDeposit({
    to,
    text,
    appointment,
  }: {
    to: string;
    text: string;
    appointment: {
      customer: { full_name: string };
      startTime: Date;
      services: {
        name: string;
        price: string;
      }[];
      staff?: { full_name: string } | null;
      address: string;
      depositAmount: string;
    };
  }) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_USER'),
      to,
      subject: `Xác nhận đã đặt cọc tại GenSpa`,
      template: 'appointment-deposit-confirmation',
      context: {
        customerName: appointment.customer.full_name,
        startTime: appointment.startTime.toLocaleString('vi-VN'),
        services: appointment.services,
        staffName: appointment.staff?.full_name || 'Đang cập nhật',
        spaAddress: appointment.address,
        depositAmount: appointment.depositAmount,
      },
      text,
    });
  }

  async sendThankYouForUsingServiceEmail(data: {
    to: string;
    customerName: string;
    services: {
      name: string;
      price: string;
    }[];
    usedDate: string;
    specialistName?: string;
    spaName: string;
    spaHotline?: string;
    feedbackUrl?: string;
  }) {
    await this.transporter.sendMail({
      to: data.to,
      subject: `Cảm ơn bạn đã sử dụng dịch vụ tại ${data.spaName}`,
      template: 'appointment-completed',
      context: {
        customerName: data.customerName,
        services: data.services,
        usedDate: data.usedDate,
        specialistName: data.specialistName || 'Đang cập nhật',
        spaName: data.spaName,
        spaHotline: data.spaHotline || '1900 1234',
        feedbackUrl: data.feedbackUrl || 'https://vicompose.vn/feedback',
        year: new Date().getFullYear(),
      },
    });
  }

  async remindUpcomingAppointment({
    to,
    text,
    appointment,
  }: {
    to: string;
    text: string;
    appointment: {
      customer: { full_name: string };
      startTime: Date;
      services: {
        name: string;
        price: string;
      }[];
      staff?: { name: string } | null;
    };
  }) {
    await this.transporter.sendMail({
      to,
      subject: `Nhắc nhở lịch hẹn sắp tới tại GenSpa`,
      template: 'appointment-reminder',
      context: {
        customerName: appointment.customer.full_name,
        startTime: appointment.startTime.toLocaleString('vi-VN'),
        services: appointment.services,
        staffName: appointment.staff?.name || 'Đang cập nhật',
      },
      text,
    });
  }

  async sendResetPasswordEmail(data: {
    to: string;
    user: { full_name?: string; email: string };
    spaHotline?: string;
    token: string;
    resetUrl: string;
  }) {
    await this.transporter.sendMail({
      to: data.user.email,
      subject: 'Đặt lại mật khẩu - GenSpa',
      template: 'forgot-password',
      context: {
        customerName: data.user.full_name || 'Khách hàng',
        spaName: 'GenSpa',
        spaHotline: data.spaHotline || '1900 1234',
        resetUrl: `${data.resetUrl}`,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendVerifyEmail(data: {
    to: string;
    customerName: string;
    verifyUrl: string;
    spaName?: string;
    spaHotline?: string;
  }) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_USER'),
      to: data.to,
      subject: `Xác thực email - ${data.spaName || 'GenSpa'}`,
      template: 'verify-email',
      context: {
        customerName: data.customerName,
        verifyUrl: data.verifyUrl,
        spaName: data.spaName || 'GenSpa',
        spaHotline: data.spaHotline || '1900 1234',
        year: new Date().getFullYear(),
      },
    });
  }

  async sendVoucherEmail(data: {
    to: string;
    customerName: string;
    voucher: Voucher;
    deadUseDate?: string;
    spaName?: string;
    spaHotline?: string;
  }) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_USER'),
      to: data.to,
      subject: `Bạn vừa nhận được voucher mới - ${data.spaName || 'GenSpa'}`,
      template: 'new-voucher',
      context: {
        customerName: data.customerName,
        usedDate: data.deadUseDate || 'Đang cập nhật',
        voucher: data.voucher,
        spaName: data.spaName || 'GenSpa',
        spaHotline: data.spaHotline || '1900 1234',
        year: new Date().getFullYear(),
      },
    });
  }

  async sendSuccessResetPasswordEmail(data: {
    to: string;
    user: { full_name?: string; email: string };
    spaHotline?: string;
  }) {
    await this.transporter.sendMail({
      to: data.user.email,
      subject: 'Đặt lại mật khẩu thành công - GenSpa',
      template: 'forgot-password-success',
      context: {
        customerName: data.user.full_name || 'Khách hàng',
        spaName: 'GenSpa',
        spaHotline: data.spaHotline || '1900 1234',
        year: new Date().getFullYear(),
      },
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
