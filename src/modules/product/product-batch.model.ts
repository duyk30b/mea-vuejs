import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Product } from './product.model'

export class ProductBatch extends BaseModel {
	@Expose({ name: 'product_id', groups: ['CREATE'] })
	productId: number

	@Expose({ name: 'batch' })
	batch: string = ''                                           // Lô sản phẩm

	@Expose({ name: 'expiry_date' })
	expiryDate?: number

	@Expose({ name: 'cost_price', groups: ['CREATE'] })
	costPrice: number = 0                                        // Giá nhập

	@Expose({ name: 'quantity', toClassOnly: true })
	quantity: number = 0

	@Expose({ name: 'retail_price' })
	retailPrice: number = 0                                      // Giá bán lẻ

	@Expose({ name: 'wholesale_price' })
	wholesalePrice: number = 0                                   // Giá bán sỉ

	@Expose({ name: 'product', toClassOnly: true })
	@Type(() => Product)
	product?: Product

	static blank() {
		const batch = new ProductBatch()
		batch.id = 0
		return batch
	}

	static fromPlain(plain: Record<string, any>): ProductBatch {
		return plainToInstance(ProductBatch, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): ProductBatch[] {
		return plainToInstance(ProductBatch, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: ProductBatch): ProductBatch {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}

	static toPlain(instance: ProductBatch, type: 'CREATE' | 'UPDATE'): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			groups: [type],
		})
	}
}
