import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';


import { CategoryVoucher } from '@/entities/categoryVoucher.entity';
import { CreateCategoryVoucherDto } from './dto/create-category-voucher.dto';
import { UpdateCategoryVoucherDto } from './dto/update-category-voucher.dto';

@Injectable()
export class CategoryVoucherService {
  constructor(
    @InjectRepository(CategoryVoucher)
    private readonly categoryRepo: Repository<CategoryVoucher>,
  ) {}

  findAll(): Promise<CategoryVoucher[]> {
    return this.categoryRepo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CategoryVoucher> {
    const cat = await this.categoryRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!cat) {
      throw new NotFoundException('Không tìm thấy danh mục voucher');
    }

    return cat;
  }

  create(dto: CreateCategoryVoucherDto): Promise<CategoryVoucher> {
    const cat = this.categoryRepo.create(dto);
    return this.categoryRepo.save(cat);
  }

  async update(id: string, dto: UpdateCategoryVoucherDto): Promise<CategoryVoucher> {
    await this.findOne(id);
    await this.categoryRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    await this.findOne(id);
    const result = await this.categoryRepo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
