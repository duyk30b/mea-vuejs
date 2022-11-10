import { Expose, plainToInstance, Transform, TransformationType, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { ProductBatch } from '../product'
import { Receipt } from './receipt.model'

export class ReceiptItem extends BaseModel {
	@Expose({ name: 'receipt_id', toClassOnly: true })
	receiptId: number

	@Expose({ name: 'product_batch_id' })
	productBatchId: number

	@Expose({ name: 'quantity' })
	quantity: number = 0

	@Expose({ name: 'unit' })
	@Transform(({ type, value }) => {
		if (type === TransformationType.PLAIN_TO_CLASS) {
			try { return JSON.parse(value) }
			catch (error) { return { name: '', rate: 1 } }
		} else if (type === TransformationType.CLASS_TO_PLAIN) {
			return JSON.stringify(value)
		}
		return value
	})
	unit: { name: string, rate: number } = { name: '', rate: 1 }

	@Expose({ name: 'product_batch', toClassOnly: true })
	@Type(() => ProductBatch)
	productBatch: ProductBatch

	@Expose({ name: 'receipt', toClassOnly: true })
	@Type(() => Receipt)
	receipt?: Receipt

	static fromPlain(plain: Record<string, any>): ReceiptItem {
		return plainToInstance(ReceiptItem, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): ReceiptItem[] {
		return plainToInstance(ReceiptItem, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromObject(object: ReceiptItem): ReceiptItem {
		const instance = new ReceiptItem()
		Object.assign(instance, object)
		return instance
	}
}
