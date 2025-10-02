import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsEmail,
  // MinLength,
  // Matches,
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
