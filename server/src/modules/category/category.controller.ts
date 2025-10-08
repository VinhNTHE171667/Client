import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  CreateCategoryServiceDto,
  UpdateCategoryServiceDto,
} from './dto/category.dto';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private category: CategoryService) {}

  @Get('')
  findAll() {
    return this.category.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.category.findOne(id);
  }

  @Post('')
  create(@Body() dto: CreateCategoryServiceDto) {
    return this.category.create(dto);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryServiceDto) {
    return this.category.update(id, dto);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.category.remove(id);
  }
}
