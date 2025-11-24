import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentStatsDto {
  @ApiPropertyOptional({ example: '2025-11-01T00:00:00.000Z', description: 'Ngày bắt đầu (ISO string)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2025-11-30T23:59:59.999Z', description: 'Ngày kết thúc (ISO string)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}