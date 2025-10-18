import { Gender } from '@/entities/customer.entity';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsArray,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Trần Thị B' })
  @IsString({ message: 'Tên không được để trống và phải là chuỗi' })
  full_name: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: 'Matkhau456' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'staffspa@gmail.com' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

  @ApiProperty({ example: 'Chuyên viên chăm sóc sức khỏe', required: false })
  @IsOptional()
  @IsString({ message: 'Tiểu sử phải là chuỗi' })
  biography: string;

  @ApiProperty({ example: 'Nha khoa' })
  @IsString({ message: 'Chuyên môn không được để trống và phải là chuỗi' })
  specialization: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsString({ message: 'Số năm kinh nghiệm phải là chuỗi' })
  experience_years: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là true hoặc false' })
  isActive?: boolean;

  @ApiProperty({
    example: ['a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6'],
  })
  @IsArray()
  @IsUUID('4', { each: true, message: 'ID dịch vụ không hợp lệ' })
  @IsOptional()
  serviceIds: string[];
}

export class UpdateDoctorDto extends OmitType(CreateDoctorDto, [
  'password',
] as const) {}

export class UpdatePasswordDto {
  @IsString()
  @IsUUID('4', { message: 'ID spa không hợp lệ' })
  id: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string;
}
