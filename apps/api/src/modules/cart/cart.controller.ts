import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';
import { v4 as uuidv4 } from 'uuid';

function getCartId(cartIdHeader: string | undefined): string {
    return cartIdHeader ?? uuidv4();
}

@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get()
    get(@Headers('x-cart-id') cartId: string) {
        return this.cartService.get(getCartId(cartId));
    }

    @Post('items')
    addItem(@Headers('x-cart-id') cartId: string, @Body() dto: AddCartItemDto) {
        return this.cartService.addItem(getCartId(cartId), dto);
    }

    @Patch('items/:productId')
    updateItem(
        @Headers('x-cart-id') cartId: string,
        @Param('productId') productId: string,
        @Body() dto: UpdateCartItemDto,
    ) {
        return this.cartService.updateItem(getCartId(cartId), productId, dto.quantity);
    }

    @Delete('items/:productId')
    removeItem(@Headers('x-cart-id') cartId: string, @Param('productId') productId: string) {
        return this.cartService.removeItem(getCartId(cartId), productId);
    }

    @Delete()
    clear(@Headers('x-cart-id') cartId: string) {
        return this.cartService.clear(getCartId(cartId));
    }
}
