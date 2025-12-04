import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCategoryVoucherDto {
  @IsString()
  name: string;

  @IsString()
  prefix: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
