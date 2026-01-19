import { Voucher } from '@/entities/voucher.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, In, Repository } from 'typeorm';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';
import { CustomerVoucher } from '@/entities/customerVoucher.entity';
import { Customer } from '@/entities/customer.entity';
import { MailService } from '../mail/mail.service';
import { Spa } from '@/entities/spa.entity';

@Injectable()
export class VoucherService {
  private spaInfo: Spa | null = null;
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,

    @InjectRepository(CustomerVoucher)
    private readonly customerVoucherRepo: Repository<CustomerVoucher>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    @InjectRepository(Spa)
    private readonly spaRepo: Repository<Spa>,

    private readonly mailService: MailService,
  ) {
    this.loadSpa();
  }

  private async loadSpa() {
    this.spaInfo = await this.spaRepo.findOne({ where: {} });
    // console.log('Spa info cached:', this.spaInfo?.name);
  }

  private async getSpa(): Promise<Spa | null> {
    if (!this.spaInfo) {
      this.spaInfo = await this.spaRepo.findOne({});
    }
    return this.spaInfo;
  }

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

    if (customerIds && customerIds.length) {
      for (const customerId of customerIds) {
        const customer = await this.customerRepository.findOne({
          where: { id: customerId },
        });
        if (!customer) continue;

        await this.customerVoucherRepo.save({
          customerId,
          voucherId: voucher.id,
        });

        const spa = await this.getSpa();

        await this.mailService.sendVoucherEmail({
          to: customer.email,
          customerName: customer.full_name,
          voucher,
          spaName: spa?.name || 'GenSpa',
          spaHotline: spa?.phone || '1900 1234',
          deadUseDate: voucher.validTo?.toLocaleString('vi-VN'),
        });
      }
    }
    return voucher;
  }

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Voucher & { customerIds?: string[] }> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) throw new NotFoundException('Voucher not found');

    const customerVouchers = await this.customerVoucherRepo.find({
      where: { voucherId: id },
    });
    const customerIds = customerVouchers.map((cv) => cv.customerId);

    return { ...voucher, customerIds };
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto & { customerIds?: string[] },
  ): Promise<Voucher & { customerIds?: string[] }> {
    const voucher = await this.findOne(id);

    Object.assign(voucher, updateVoucherDto);
    await this.voucherRepo.save(voucher);

    if (updateVoucherDto.customerIds) {
      const oldCustomerVouchers = await this.customerVoucherRepo.find({
        where: { voucherId: id },
      });
      const oldCustomerIds = oldCustomerVouchers.map((cv) => cv.customerId);

      const newCustomerIds = updateVoucherDto.customerIds.filter(
        (cid) => !oldCustomerIds.includes(cid),
      );

      await this.customerVoucherRepo.delete({ voucherId: id });

      const customerVouchers = updateVoucherDto.customerIds.map((customerId) =>
        this.customerVoucherRepo.create({ customerId, voucherId: id }),
      );
      await this.customerVoucherRepo.save(customerVouchers);

      voucher.customerIds = updateVoucherDto.customerIds;

      if (newCustomerIds.length) {
        const spa = await this.getSpa();
        for (const customerId of newCustomerIds) {
          const customer = await this.customerRepository.findOne({
            where: { id: customerId },
          });
          if (!customer) continue;

          await this.mailService.sendVoucherEmail({
            to: customer.email,
            customerName: customer.full_name,
            voucher,
            spaName: spa?.name || 'GenSpa',
            spaHotline: spa?.phone || '1900 1234',
            deadUseDate: voucher.validTo?.toLocaleString('vi-VN'),
          });
        }
      }
    }

    return voucher;
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findOne(id);
    await this.voucherRepo.softRemove(voucher);
  }

  async findVouchersByCustomer(customerId: string): Promise<Voucher[]> {
    const customerVouchers = await this.customerVoucherRepo.find({
      where: { customerId, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    const voucherIds = customerVouchers.map((cv) => cv.voucherId);

    if (voucherIds.length === 0) {
      return [];
    }
    const vouchers = await this.voucherRepo.find({
      where: { id: In(voucherIds), deletedAt: IsNull() },
       order: { createdAt: 'DESC' }, 
    });
    return vouchers;
  }
}
