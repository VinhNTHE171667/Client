import {
  IsUUID,
  IsDateString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, ApiProperty } from '@nestjs/swagger';

class AppointmentDetailDto {
  @ApiProperty({
    example: 'a9b5c9a1-2b7f-4c3e-9e6b-8a12d45678f9',
    description: 'ID của dịch vụ được chọn',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    example: 250000,
    description: 'Giá của dịch vụ tại thời điểm đặt',
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;
}

export class CreateAppointmentDto {
  @ApiProperty({
    example: 'a0f39d54-c5f8-4f91-8c6b-1b3a7292f123',
    description: 'ID của khách hàng đặt lịch',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    example: 'b6c8e14a-2a29-4d6b-a3f7-45c2e87c9123',
    description: 'ID của bác sĩ phụ trách (nếu có)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiProperty({
    example: 'c92e5e0b-2c81-4b4a-b7b4-3f8b7f71a456',
    description: 'ID của nhân viên phụ trách (nếu có)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiProperty({
    example: '2025-11-05',
    description: 'Ngày hẹn (định dạng ISO 8601)',
  })
  @IsDateString()
  appointment_date: Date;

  @ApiProperty({
    example: '2025-11-05T09:00:00.000Z',
    description: 'Thời gian bắt đầu cuộc hẹn',
  })
  @IsDateString()
  startTime: Date;

  @ApiProperty({
    example: '2025-11-05T10:00:00.000Z',
    description: 'Thời gian kết thúc cuộc hẹn',
  })
  @IsDateString()
  endTime: Date;

  @ApiProperty({
    type: [AppointmentDetailDto],
    description: 'Danh sách dịch vụ được chọn trong cuộc hẹn',
    example: [
      {
        serviceId: 'f54b2a6a-bd21-4a84-9f5a-3c8a8c9e7890',
        price: 250000,
      },
      {
        serviceId: 'a32b2a6a-cc21-4a84-9f5a-3c8a8c9e1111',
        price: 400000,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentDetailDto)
  details: AppointmentDetailDto[];

  @ApiProperty({
    example: 'Khách hàng muốn massage nhẹ vùng vai cổ.',
    required: false,
  })
  @IsOptional()
  note?: string;

  @ApiProperty({
    example: '1b2c3d4e-5678-9101-1121-314151617181',
    description: 'ID voucher được áp dụng (nếu có)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  voucherId?: string;

  @ApiProperty({
    example: 650000,
    description: 'Tổng số tiền của cuộc hẹn sau khi áp dụng voucher (nếu có)',
  })
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number = 0;

  @ApiProperty({
    example: 10,
    description: 'Phần trăm giảm giá từ thành viên (nếu có)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  membershipDiscount?: number;
}

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}

export class RequestCancelDto {
  @IsUUID()
  doctorId: string;

  @IsUUID()
  appointmentId: string;

  @IsNotEmpty()
  reason: string;
}
