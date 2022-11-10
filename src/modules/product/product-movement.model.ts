import { Expose, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { ProductMovementType } from '../enum'
import { Invoice } from '../invoice'
import { Receipt } from '../receipt'
import { ProductBatch } from './product-batch.model'

export class ProductMovement extends BaseModel {
	@Expose({ name: 'product_id', toClassOnly: true })
	productId: number

	@Expose({ name: 'receipt_id', toClassOnly: true })
	productBatchId: number

	@Expose({ name: 'reference_id' })
	referenceId: number

	@Expose({ name: 'type' })
	type: ProductMovementType

	@Expose({ name: 'is_refund' })
	isRefund: boolean

	@Expose({ name: 'open_quantity' })
	openQuantity: number                                  // Số lượng ban đầu

	@Expose({ name: 'number' })
	number: number                                        // Số lượng +/-

	@Expose({ name: 'close_quantity' })
	closeQuantity: number                                 // Số lượng sau thay đổi

	@Expose({ name: 'price' })
	price: number                                        // Giá

	@Expose({ name: 'total_money' })
	totalMoney: number                                   // Tổng tiền

	@Expose({ name: 'create_time' })
	createTime: number

	@Expose({ name: 'product_batch', toClassOnly: true })
	@Type(() => ProductBatch)
	productBatch?: ProductBatch

	@Expose({ name: 'invoice', toClassOnly: true })
	@Type(() => Invoice)
	invoice?: Invoice

	@Expose({ name: 'receipt', toClassOnly: true })
	@Type(() => Receipt)
	receipt?: Receipt

	static fromPlain(plain: Record<string, any>): ProductMovement {
		return plainToInstance(ProductMovement, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): ProductMovement[] {
		return plainToInstance(ProductMovement, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: ProductMovement): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}
}
