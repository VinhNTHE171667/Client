import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsEmail,
  // MinLength,
  // Matches,
  IsUrl,
  IsBoolean,
} from 'class-validator';
import { Gender } from '@/entities/customer.entity';

export class RegisterCustomerDto {
  @ApiProperty()
  @IsString({ message: 'Họ và tên không được để trống' })
  full_name: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender: Gender;

  @ApiPropertyOptional({
    example: '2003-05-11',
    description: 'Ngày sinh định dạng ISO (YYYY-MM-DD)',
  })
  @IsDateString(
    {},
    { message: 'Ngày sinh không hợp lệ (định dạng YYYY-MM-DD)' },
  )
  @IsOptional()
  birth_date?: string;

  @ApiProperty()
  @IsString({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @ApiPropertyOptional({
    example: 'thienhieuloice@gmail.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    // minLength: 6,
  })
  @IsString({ message: 'Mật khẩu không được để trống' })
  // @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiPropertyOptional()
  @IsString({ message: 'Địa chỉ không hợp lệ' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'Nguồn giới thiệu không hợp lệ' })
  @IsOptional()
  referral_source?: string;
}

export class RegisterSpa {
  @ApiProperty({
    example: 'Sunshine Spa',
    description: 'Tên của spa',
  })
  @IsString({ message: 'Tên spa không được để trống' })
  name: string;

  @ApiProperty({
    // minLength: 6,
  })
  @IsString({ message: 'Mật khẩu không được để trống' })
  // @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({
    example: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    description: 'Địa chỉ chi tiết của spa',
  })
  @IsString({ message: 'Địa chỉ không được để trống' })
  address: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Số điện thoại của spa',
  })
  @IsString({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @ApiProperty({
    example: 'sunshine_spa@gmail.com',
    description: 'Email của spa',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsOptional()
  @IsUrl({}, { message: 'Website không hợp lệ' })
  website?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Logo không hợp lệ' })
  logo?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả không hợp lệ' })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động không hợp lệ' })
  isActive?: boolean;
}
