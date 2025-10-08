import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  CreateCategoryServiceDto,
  UpdateCategoryServiceDto,
} from './dto/category.dto';
import { Category } from '@/entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { deletedAt: IsNull() },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục`);
    }
    return category;
  }

  async create(dto: CreateCategoryServiceDto): Promise<Category> {
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: UpdateCategoryServiceDto): Promise<Category> {
    await this.findOne(id);
    await this.categoryRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    const category = await this.findOne(id);

    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục`);
    }

    const result = await this.categoryRepo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
