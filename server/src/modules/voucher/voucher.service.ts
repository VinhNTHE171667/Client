import { Voucher } from '@/entities/voucher.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    const voucherExists = await this.voucherRepo.findOne({
      where: { code: createVoucherDto.code, deletedAt: IsNull() },
    });

    if (voucherExists) {
      throw new BadRequestException('Mã voucher đã tồn tại');
    }

    const voucher = this.voucherRepo.create(createVoucherDto);

    try {
      return await this.voucherRepo.save(voucher);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Mã voucher đã tồn tại');
      }
      throw error;
    }
  }

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    return voucher;
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    const voucher = await this.findOne(id);
    Object.assign(voucher, updateVoucherDto);
    return this.voucherRepo.save(voucher);
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findOne(id);
    await this.voucherRepo.softRemove(voucher);
  }
}
