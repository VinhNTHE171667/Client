import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackStatus } from '@/entities/enums/feedback-status';

export class CreateFeedbackDto {
  @ApiProperty({ description: 'ID của appointment' })
  @IsString()
  appointmentId: string;

  @ApiProperty({ description: 'ID của customer' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'ID của service' })
  @IsString()
  serviceId: string;

  @ApiProperty({ description: 'Điểm đánh giá từ 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Bình luận của khách hàng' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateFeedbackDto {
  @ApiPropertyOptional({
    description: 'Điểm đánh giá từ 1-5',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Bình luận của khách hàng' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái feedback',
    enum: FeedbackStatus,
  })
  @IsOptional()
  @IsString()
  status?: FeedbackStatus;
}
