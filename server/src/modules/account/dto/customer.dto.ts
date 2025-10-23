import { CustomerType } from '@/entities/enums/customer-type.enum';
import { Gender } from '@/entities/enums/gender.enum';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsEmail,
  IsBoolean,
  IsDecimal,
  //   MinLength,
  //   Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  full_name: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  birth_date?: string;

  @ApiProperty({
    // minLength: 6,
    // pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*?&]+$',
  })
  @IsString()
  //   @MinLength(6)
  //   @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/)
  password: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: CustomerType })
  @IsEnum(CustomerType)
  @IsOptional()
  customer_type?: CustomerType;

  @ApiPropertyOptional()
  @IsDecimal()
  @IsOptional()
  total_spent?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

export class UpdateCustomerDto extends OmitType(CreateCustomerDto, [
  'password',
] as const) {}

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  //   @MinLength(6)
  //   @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, {
  //     message: 'Password too weak',
  //   })
  newPassword: string;
}
