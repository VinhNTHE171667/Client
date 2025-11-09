import { Voucher } from '@/entities/voucher.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';
import { CustomerVoucher } from '@/entities/customerVoucher.entity';
import { Customer } from '@/entities/customer.entity';
import { MailModule } from '../mail/mail.module';
import { Spa } from '@/entities/spa.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register(),
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Voucher, CustomerVoucher, Customer, Spa]),
    MailModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.EXPIRE_TIME_ACCESS },
    }),
  ],
  controllers: [VoucherController],
  providers: [VoucherService],
})
export class VoucherModule {}
