import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '@/entities/customer.entity';
import { Membership } from '@/entities/membership.entity';
import { Invoice } from '@/entities/invoice.entity'; // chắc chắn bạn có entity này

@Injectable()
export class MembershipCronService {
  private readonly logger = new Logger(MembershipCronService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,

    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoUpdateMembershipLevels() {
    this.logger.log('Bắt đầu kiểm tra và cập nhật hạng thành viên...');

    const memberships = await this.membershipRepo.find({
      order: { minSpent: 'ASC' },
    });

    if (!memberships.length) {
      this.logger.warn('Không tìm thấy dữ liệu Membership nào.');
      return;
    }

    const customers = await this.customerRepo.find({
      where: { isActive: true },
      relations: ['membership'],
    });

    let updatedCount = 0;

    for (const customer of customers) {
      const invoices = await this.invoiceRepo.find({
        where: { customerId: customer.id, payment_status: 'paid' },
      });

      const totalSpent = invoices.reduce(
        (sum, inv) => sum + Number(inv.finalAmount),
        0,
      );

      customer.total_spent = totalSpent;

      const newMembership = memberships.find((m) => {
        const min = Number(m.minSpent);
        const max = m.maxSpent !== null ? Number(m.maxSpent) : Infinity;
        return totalSpent >= min && totalSpent <= max;
      });

      if (!newMembership) continue;

      if (customer.membershipId !== newMembership.id) {
        customer.membershipId = newMembership.id;
        await this.customerRepo.save(customer);
        updatedCount++;
        this.logger.log(
          `${customer.full_name} được thăng hạng lên: ${newMembership.name}`,
        );
      }
    }

    if (updatedCount > 0) {
      this.logger.log(`Đã cập nhật ${updatedCount} khách hàng.`);
    } else {
      this.logger.log('Không có khách hàng nào cần cập nhật hạng.');
    }
  }
}
