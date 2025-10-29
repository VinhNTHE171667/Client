import {
  IsUUID,
  IsDateString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

class AppointmentDetailDto {
  @IsUUID()
  serviceId: string;

  //   @IsNotEmpty()
  //   quantity: number;

  @IsNotEmpty()
  price: number;
}

export class CreateAppointmentDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsDateString()
  appointment_date: Date;

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentDetailDto)
  details: AppointmentDetailDto[];

  @IsOptional()
  note?: string;

  @IsOptional()
  @IsUUID()
  voucherId?: string;
}

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}
