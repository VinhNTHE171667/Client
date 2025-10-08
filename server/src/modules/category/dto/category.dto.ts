import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCategoryServiceDto {
  @ApiProperty({
    example: 'Massage thư giãn',
    description: 'Tên danh mục dịch vụ',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Dịch vụ massage giúp thư giãn cơ thể',
    description: 'Mô tả thêm về dịch vụ (tuỳ chọn)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là true hoặc false' })
  isActive?: boolean;
}

export class UpdateCategoryServiceDto extends PartialType(
  CreateCategoryServiceDto,
) {}
