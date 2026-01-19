import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CategoryVoucherService } from './category-voucher.service';
import { CreateCategoryVoucherDto } from './dto/create-category-voucher.dto';
import { UpdateCategoryVoucherDto } from './dto/update-category-voucher.dto';

@Controller('category-voucher')
export class CategoryVoucherController {
  constructor(private readonly categoryService: CategoryVoucherService) {}

  @Get('')
  findAll() {
    return this.categoryService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Post('')
  create(@Body() dto: CreateCategoryVoucherDto) {
    return this.categoryService.create(dto);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryVoucherDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
