import { Cart } from '@/entities/cart.entity';
import { CartDetail } from '@/entities/cartDetails.entity';
import { Category } from '@/entities/category.entity';
import { Service } from '@/entities/service.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import omit from 'lodash/omit';
import { Doctor } from '@/entities/doctor.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,

    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartDetail)
    private readonly cartDetailRepo: Repository<CartDetail>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

 async getCartById(customerId: string) {
  const cart = await this.cartRepo.findOne({
    where: { customerId },
    relations: ['details', 'details.service'],
  });

  if (!cart) {
    const newCart = this.cartRepo.create({
      customerId,
      details: [],
    });

    return this.cartRepo.save(newCart);
  }

  const items = await Promise.all(
    cart.details.map(async (detail) => {
      let doctor: Doctor | null = null;
      if (detail.doctorId) {
        doctor = await this.doctorRepo.findOne({
          where: { id: detail.doctorId }, 
        });
        // If doctor not found, set null (no throw, skip gracefully)
      }

      // Base item data
      const item = {
        id: detail.service.id,
        name: detail.service.name,
        description: detail.service.description,
        price: detail.service.price,
        quantity: detail.quantity,
        images: detail.service.images,
        categoryId: detail.service.categoryId,
      };

      // Conditionally add doctor if exists
      if (doctor) {
        return {
          ...item,
          doctor: {
            id: doctor.id,
            name: doctor.full_name,
            specialization: doctor.specialization,
            avatar: doctor.avatar,
            biography: doctor.biography,
            experience_years: doctor.experience_years,
          },
        };
      }

      // If no doctor (or not found), return without doctor field
      return item;
    }),
  );

  const cartResponse = {
    id: cart.id,
    items,
  };

  return omit(cartResponse, ['createdAt', 'updatedAt']);
}

   async addItemToCart(
  customerId: string,
  itemData: { itemId: string; quantity?: number },
  doctorId?: string | null, // Optional, allow null
) {
  const { itemId, quantity = 1 } = itemData;

  let cart = await this.cartRepo.findOne({
    where: { customerId },
    relations: ['details', 'details.service'],
  });

  if (!cart) {
    cart = this.cartRepo.create({
      customerId,
      details: [],
    });
    cart = await this.cartRepo.save(cart);
  }

  const service = await this.serviceRepo.findOne({
    where: { id: itemId },
    relations: ['doctors'],
  });
  if (!service) throw new NotFoundException('Không tìm thấy dịch vụ');

  if (doctorId) {
    const doctors = service.doctors || [];
    if (!doctors.find((doc) => doc.id === doctorId)) {
      throw new BadRequestException(
        'Bác sĩ không được phép thêm dịch vụ này vào giỏ hàng',
      );
    }
  }

  const whereClause = doctorId 
    ? { serviceId: service.id, doctorId } 
    : { serviceId: service.id, doctorId: IsNull() }; 

  const existingDetail = await this.cartDetailRepo.findOne({
    where: whereClause,
    relations: ['cart'],
  });

  if (existingDetail) {
    throw new BadRequestException('Dịch vụ này đã có trong giỏ hàng');
  }

  const newDetailData = {
    cartId: cart.id,
    serviceId: service.id, 
    quantity,
    doctorId: doctorId || null,
  };

  const newDetail = this.cartDetailRepo.create(newDetailData);
  await this.cartDetailRepo.save(newDetail);

  return this.getCartById(customerId);
}


  async removeItemFromCart(customerId: string, itemId: string) {
    const cart = await this.cartRepo.findOne({
      where: { customerId },
      relations: ['details'],
    });
    if (!cart) throw new NotFoundException('Không tìm thấy giỏ hàng');

    const detail = cart.details.find((d) => d.serviceId === itemId);
    if (!detail)
      throw new BadRequestException('Sản phẩm không tồn tại trong giỏ hàng');

    await this.cartDetailRepo.delete(detail.id);

    return this.getCartById(cart.customerId);
  }

  async clearCart(cartId: string) {
    const cart = await this.cartRepo.findOne({
      where: { id: cartId },
      relations: ['details'],
    });
    if (!cart) throw new NotFoundException('Không tìm thấy giỏ hàng');

    if (cart.details.length > 0) {
      await this.cartDetailRepo.remove(cart.details);
    }

    return this.getCartById(cart.customerId);
  }
}
