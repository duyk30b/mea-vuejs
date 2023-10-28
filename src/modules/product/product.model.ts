import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { ProductBatch } from './product-batch.model'
import { ProductMovement } from './product-movement.model'

export class Product extends BaseModel {
	@Expose({ name: 'quantity', toClassOnly: true })
	quantity: number = 0

	@Expose({ name: 'brand_name' })
	brandName: string = ''                           // Tên biệt dược

	@Expose({ name: 'substance' })
	substance?: string = ''                           // Hoạt chất

	@Expose({ name: 'group' })
	group: string = ''                               // Nhóm thuốc: kháng sinh, dinh dưỡng ...

	@Expose({ name: 'unit' })
	unit: { name: string, rate: number, default?: boolean }[] = [{ name: '', rate: 1 }]

	@Expose({ name: 'route' })
	route: string = ''                               // Đường dùng: ... Ấn Độ, Ý, Pháp, ...

	@Expose({ name: 'source' })
	source: string = ''                              // Nguồn gốc: ... Ấn Độ, Ý, Pháp, ...

	@Expose({ name: 'image' })
	image: string = ''

	@Expose({ name: 'hint_usage' })
	hintUsage: string = ''                           // Gợi ý cách sử dụng

	@Expose({ name: 'is_active' })
	isActive: boolean = true                            // Trạng thái

	@Expose({ name: 'product_batches', toClassOnly: true })
	@Type(() => ProductBatch)
	productBatches: ProductBatch[] = []

	@Expose({ name: 'product_movements', toClassOnly: true })
	@Type(() => ProductMovement)
	productMovements: ProductMovement[] = []

	static blank(): Product {
		const product = new Product()
		return product
	}

	static fromPlain(plain: Record<string, any>): Product {
		return plainToInstance(Product, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): Product[] {
		return plainToInstance(Product, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Product): Product {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}

	static toPlain(instance: Product): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}
}
