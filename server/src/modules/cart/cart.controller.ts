import { Controller, Get, Param, Post } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get(':id')
  getCart(@Param('id') id: string) {
    return this.cartService.getCartById(id);
  }

  @Post('/add/:itemId')
  addItemToCart(@Param('itemId') itemId: string) {
    return this.cartService.addItemToCart(itemId);
  }

  @Post('/remove/:itemId')
  removeItemFromCart(@Param('itemId') itemId: string) {
    return this.cartService.removeItemFromCart(itemId);
  }

  @Post('/clear/:id')
  clearCart(@Param('id') id: string) {
    return this.cartService.clearCart(id);
  }

  
}
