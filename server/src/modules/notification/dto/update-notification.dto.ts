import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái đọc phải là boolean' })
  isRead?: boolean;
}