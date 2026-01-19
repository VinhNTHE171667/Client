import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryVoucherDto } from './create-category-voucher.dto';

export class UpdateCategoryVoucherDto extends PartialType(CreateCategoryVoucherDto) {}
