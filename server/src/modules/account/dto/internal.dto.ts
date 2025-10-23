import { Gender } from '@/entities/enums/gender.enum';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateInternalDto {
  @ApiProperty({ example: 'Trần Thị B' })
  @IsString({ message: 'Tên không được để trống và phải là chuỗi' })
  full_name: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '0123456789', required: false })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

  @ApiProperty({ example: 'Matkhau456' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'staffspa@gmail.com' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là true hoặc false' })
  isActive?: boolean;

  @ApiProperty({ example: 'Nhân viên spa' })
  @IsOptional()
  @IsString({ message: 'Chức vụ phải là chuỗi' })
  positionID: string;
}

export class UpdateInternalDto extends OmitType(CreateInternalDto, [
  'password',
  'positionID',
] as const) {}

export class UpdatePasswordDto {
  @IsString()
  @IsUUID('4', { message: 'ID spa không hợp lệ' })
  id: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string;
}
