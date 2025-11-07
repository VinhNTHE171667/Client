import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMembershipDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSpent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSpent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;
}
