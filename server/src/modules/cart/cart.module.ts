import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Service } from '@/entities/service.entity';
import { Cart } from '@/entities/cart.entity';
import { Category } from '@/entities/category.entity';
import { CartDetail } from '@/entities/cartDetails.entity';
import { Doctor } from '@/entities/doctor.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Service, Cart, CartDetail, Category, Doctor]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.EXPIRE_TIME_ACCESS },
    }),
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
