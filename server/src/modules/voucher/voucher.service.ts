import { Voucher } from '@/entities/voucher.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';
import { CustomerVoucher } from '@/entities/customerVoucher.entity';
import { Customer } from '@/entities/customer.entity';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,

    @InjectRepository(CustomerVoucher)
    private readonly customerVoucherRepo: Repository<CustomerVoucher>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async createForCustomers(
    createVoucherDto: CreateVoucherDto,
  ): Promise<Voucher> {
    const { customerIds, ...voucherData } = createVoucherDto;

    const voucherExists = await this.voucherRepo.findOne({
      where: { code: voucherData.code, deletedAt: IsNull() },
    });

    if (voucherExists) {
      throw new BadRequestException('Mã voucher đã tồn tại');
    }

    const voucher = this.voucherRepo.create(voucherData);
    await this.voucherRepo.save(voucher);

    if (customerIds?.length) {
      const customerVouchers = customerIds.map((customerId) =>
        this.customerVoucherRepo.create({ customerId, voucherId: voucher.id }),
      );
      await this.customerVoucherRepo.save(customerVouchers);
    }
    return voucher;
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
    updateVoucherDto: UpdateVoucherDto & { customerIds?: string[] },
  ): Promise<Voucher> {
    const voucher = await this.findOne(id);

    Object.assign(voucher, updateVoucherDto);
    await this.voucherRepo.save(voucher);

    if (updateVoucherDto.customerIds) {
      await this.customerVoucherRepo.delete({ voucherId: id });

      const customerVouchers = updateVoucherDto.customerIds.map((customerId) =>
        this.customerVoucherRepo.create({
          customerId,
          voucherId: id,
        }),
      );

      await this.customerVoucherRepo.save(customerVouchers);
    }

    return voucher;
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findOne(id);
    await this.voucherRepo.softRemove(voucher);
  }
}
