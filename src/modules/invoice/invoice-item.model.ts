import { Expose, instanceToInstance, plainToInstance, Transform, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Customer } from '../customer'
import { DiscountType } from '../enum'
import { Procedure } from '../procedure'
import { ProductBatch } from '../product'
import { Invoice } from './invoice.model'

export enum InvoiceItemType {
	ProductBatch = 1,
	Procedure = 2,
}

export class InvoiceItem extends BaseModel {
	@Expose({ name: 'invoice_id', toClassOnly: true })
	invoiceId: number

	@Expose({ name: 'customer_id', toClassOnly: true })
	customerId: number

	@Expose({ name: 'reference_id' })
	referenceId: number

	@Expose({ name: 'type' })
	type: InvoiceItemType

	@Expose({ name: 'unit' })
	unit: { name: string, rate: number } = { name: '', rate: 1 }

	@Expose({ name: 'cost_price' })
	@Transform(({ value }) => value || 0)
	costPrice: number                                   // Giá cost

	@Expose({ name: 'expected_price' })
	expectedPrice: number = 0                           // Giá dự kiến

	@Expose({ name: 'discount_money' })
	@Transform(({ value }) => value || 0)
	discountMoney: number = 0                           // tiền giảm giá

	@Expose({ name: 'discount_percent' })
	@Transform(({ value }) => value || 0)
	discountPercent: number = 0                         // % giảm giá

	@Expose({ name: 'discount_type' })
	discountType: DiscountType = DiscountType.Percent   // Loại giảm giá

	@Expose({ name: 'actual_price' })
	@Transform(({ value }) => value || 0)
	actualPrice: number = 0                             // Giá thực tế

	@Expose({ name: 'quantity' })
	quantity: number = 0

	@Expose({ name: 'hint_usage' })                    // Hướng dẫn sử dụng
	hintUsage: string | null

	@Expose({ name: 'invoice', toClassOnly: true })
	@Type(() => Invoice)
	invoice?: Invoice

	@Expose({ name: 'product_batch', toClassOnly: true })
	@Type(() => ProductBatch)
	productBatch: ProductBatch

	@Expose({ name: 'procedure', toClassOnly: true })
	@Type(() => Procedure)
	procedure: Procedure

	@Expose({ name: 'customer', toClassOnly: true })
	@Type(() => Customer)
	customer?: Customer

	static blank(): InvoiceItem {
		return new InvoiceItem()
	}

	static fromPlain(plain: Record<string, any>): InvoiceItem {
		return plainToInstance(InvoiceItem, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): InvoiceItem[] {
		return plainToInstance(InvoiceItem, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: InvoiceItem): InvoiceItem {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}

	static fromInstances(instances: InvoiceItem[]): InvoiceItem[] {
		return instanceToInstance(instances, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}

	static fromObject(object: InvoiceItem): InvoiceItem {
		const instance = new InvoiceItem()
		Object.assign(instance, object)
		return instance
	}
}
