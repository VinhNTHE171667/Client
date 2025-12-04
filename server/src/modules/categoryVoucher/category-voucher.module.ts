import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryVoucherService } from './category-voucher.service';
import { CategoryVoucherController } from './category-voucher.controller';
import { CategoryVoucher } from '@/entities/categoryVoucher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryVoucher])],
  controllers: [CategoryVoucherController],
  providers: [CategoryVoucherService],
})
export class CategoryVoucherModule {}
