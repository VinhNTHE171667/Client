import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get(':id')
  getCart(@Param('id') customerId: string) {
    return this.cartService.getCartById(customerId);
  }

  @Post('/add/:id')
  addItemToCart(
    @Param('id') customerId: string,
    @Body() itemData: { itemId: string; quantity?: number },
    @Body('doctorId') doctorId: string,
  ) {
    return this.cartService.addItemToCart(customerId, itemData, doctorId);
  }

  @Delete(':id/items/:itemId')
  removeItemFromCart(
    @Param('id') customerId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItemFromCart(customerId, itemId);
  }

  @Post('/clear/:id')
  clearCart(@Param('id') customerId: string) {
    return this.cartService.clearCart(customerId);
  }
}
