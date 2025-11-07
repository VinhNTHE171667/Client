import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '@/entities/customer.entity';
import { Membership } from '@/entities/membership.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Membership]),
    ScheduleModule.forRoot(),
  ],
  providers: [MembershipService],
})
export class MembershipModule {}
