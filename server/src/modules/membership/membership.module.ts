import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '@/entities/customer.entity';
import { Membership } from '@/entities/membership.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { MembershipController } from './membership.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Membership]),
    ScheduleModule.forRoot(),
  ],
  controllers: [MembershipController],
  providers: [MembershipService],
})
export class MembershipModule {}
