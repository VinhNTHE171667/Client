import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'example@gmail.com' })
  @IsString({ message: 'Email phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'yourPassword123' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh_token_string' })
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  refresh_token: string;
}
