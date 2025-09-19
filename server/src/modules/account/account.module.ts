import { Customer } from '@/entities/customer.entity';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { Module } from '@nestjs/common';
import { Admin } from '@/entities/admin.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Customer, Admin]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.EXPIRE_TIME_ACCESS },
    }),
  ],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
