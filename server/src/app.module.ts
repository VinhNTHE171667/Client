import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/data-source';
import { AuthModule } from './modules/auth/auth.module';
import { AccountModule } from './modules/account/account.module';
import { CategoryModule } from './modules/category/category.module';
import { ServiceModule } from './modules/service/service.module';
import { CartModule } from './modules/cart/cart.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { PaymentModule } from './modules/payment/payment.module';
import { VoucherModule } from './modules/voucher/voucher.module';
import { MembershipModule } from './modules/membership/membership.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { NotificationModule } from './modules/notification/notification.module'; 
import { ScheduleModule } from '@nestjs/schedule';
import { CategoryVoucherModule } from './modules/categoryVoucher/category-voucher.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(dataSourceOptions),
    ScheduleModule.forRoot(),
    AuthModule,
    AccountModule,
    CategoryModule,
    ServiceModule,
    CartModule,
    AppointmentModule,
    PaymentModule,
    VoucherModule,
    MembershipModule,
    FeedbackModule,
    NotificationModule,
    CategoryVoucherModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}