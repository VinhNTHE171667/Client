import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '@/entities/appointment.entity';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';
import { Repository } from 'typeorm';
import { Internal } from '@/entities/internal.entity';
import { Service } from '@/entities/service.entity';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly payosService: PaymentService,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AppointmentDetail)
    private readonly detailRepo: Repository<AppointmentDetail>,

    @InjectRepository(Internal)
    private readonly internalRepo: Repository<Internal>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  @Post('create-link')
  async createLink(
    @Body()
    body: {
      appointmentId: string;
      amount: number;
      description: string;
      returnUrl: string;
      cancelUrl: string;
      customerName: string;
    },
  ) {
    const orderCode = Math.floor(Date.now() / 1000);

    const payment = await this.payosService.createPaymentLink({
      amount: body.amount,
      description: body.description,
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl,
      orderCode,
    });

    await this.appointmentRepo.update(body.appointmentId, { orderCode });

    return payment;
  }

  @Post('update-status')
  async updateStatus(
    @Body()
    body: {
      orderCode: string;
      status: 'PAID' | 'CANCELLED';
    },
  ) {
    return this.payosService.updatePaymentStatus(body);
  }

  // @Post('webhook')
  // @HttpCode(200)
  // async handleWebhook(@Body() body: any) {
  //   await this.payosService.processWebhook(body);
  // }
}
