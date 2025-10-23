import { Category } from '@/entities/category.entity';
import { Service } from '@/entities/service.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async getCartById(id: string) {
    // Logic to retrieve cart by ID
    return this.categoryRepo.findOne({ where: { id } });
  }

  async addItemToCart(itemId: string) {
    // Logic to add item to cart
    const item = await this.serviceRepo.findOne({ where: { id: itemId } });
    if (item) {
      // Add item to cart
    }
  }

  async removeItemFromCart(itemId: string) {
    // Logic to remove item from cart
    const item = await this.serviceRepo.findOne({ where: { id: itemId } });
    if (item) {
      // Remove item from cart
    }
  }

  async clearCart(id: string) {
    const cart = await this.categoryRepo.findOne({ where: { id } });
    if (cart) {
      // Logic to clear the cart
    }
  }
}
