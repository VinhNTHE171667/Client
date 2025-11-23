import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { NotificationType } from '@/entities/enums/notification-type.enum';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  content: string;

  @IsOptional()
  @IsEnum(NotificationType, { message: 'Loại thông báo không hợp lệ' })
  @Transform(({ value }) => value || NotificationType.Info)
  type?: NotificationType;

  @IsUUID('all', { message: 'ID người dùng không hợp lệ' })
  @IsNotEmpty({ message: 'ID người dùng không được để trống' })
  userId: string;

  @IsString()
  @IsNotEmpty({ message: 'Loại người dùng không được để trống' })
  @Transform(({ value }) => value.toLowerCase())
  userType: 'customer' | 'doctor' | 'internal';

  @IsOptional()
  @IsString({ message: 'URL hành động không hợp lệ' })
  actionUrl?: string;

  @ValidateIf(o => o.relatedId)
  @IsUUID('all', { message: 'ID liên quan không hợp lệ' })
  relatedId?: string;

  @ValidateIf(o => o.relatedType)
  @IsString({ message: 'Loại liên quan không hợp lệ' })
  relatedType?: string;
}