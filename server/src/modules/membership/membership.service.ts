import { Membership } from '@/entities/membership.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateMembershipDto } from './dto/membership.dto';

@Injectable()
export class MembershipService {
  @InjectRepository(Membership)
  private readonly membershipRepo: Repository<Membership>;

  async findAll(): Promise<Membership[]> {
    return this.membershipRepo.find({
      order: { minSpent: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Membership> {
    const membership = await this.membershipRepo.findOne({ where: { id } });
    if (!membership) {
      throw new NotFoundException(`Không tìm thấy Membership có id: ${id}`);
    }
    return membership;
  }

  async update(id: string, dto: UpdateMembershipDto): Promise<Membership> {
    const membership = await this.findOne(id);

    Object.assign(membership, dto);

    return await this.membershipRepo.save(membership);
  }

  async findByCustomer(customerId: string): Promise<Membership | null> {
    const membership = await this.membershipRepo
      .createQueryBuilder('membership')
      .innerJoin(
        'membership.customers',
        'customer',
        'customer.id = :customerId',
        { customerId },
      )
      .getOne();

    return membership || null;
  }
}
