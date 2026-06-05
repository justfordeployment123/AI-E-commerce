import { Controller } from '@nestjs/common';
import { ProductPricingService } from './product-pricing.service';

@Controller('product-pricing')
export class ProductPricingController {
    constructor(private readonly service: ProductPricingService) {}
}
