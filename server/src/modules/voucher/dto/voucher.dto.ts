import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateVoucherDto {
  @ApiProperty({
    example: 'DISCOUNT2025',
    description: 'Mã voucher (phải là duy nhất)',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    example: 'Giảm giá dịch vụ massage cuối năm',
    description: 'Mô tả chi tiết về voucher',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Số tiền giảm cố định (VNĐ)',
  })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Phần trăm giảm giá (%)',
  })
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Giá trị giảm tối đa (VNĐ)',
  })
  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @ApiPropertyOptional({
    example: '2025-11-01T00:00:00Z',
    description: 'Ngày bắt đầu hiệu lực của voucher (ISO Date)',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'Ngày hết hạn của voucher (ISO Date)',
  })
  @IsOptional()
  @IsDateString()
  validTo?: Date;

  @ApiPropertyOptional({
    example: true,
    description: 'Trạng thái hoạt động của voucher (true = đang hoạt động)',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {}
