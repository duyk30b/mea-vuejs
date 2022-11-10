import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Transform, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Distributor } from '../distributor'
import { DiscountType, type PaymentStatus } from '../enum'
import { ReceiptItem } from './receipt-item.model'

export class Receipt extends BaseModel {
	@Expose({ name: 'purchase_id', toClassOnly: true })
	purchaseId: number

	@Expose({ name: 'distributor_id', groups: ['CREATE'] })
	distributorId: number

	@Expose({ name: 'payment_status', toClassOnly: true })
	paymentStatus: PaymentStatus

	@Expose({ name: 'payment_time', toClassOnly: true })
	paymentTime?: number

	@Expose({ name: 'refund_time', toClassOnly: true })
	refundTime?: number

	@Expose({ name: 'total_item_money' })
	totalItemMoney: number = 0                    // tiền sản phẩm

	@Expose({ name: 'discount_money' })
	@Transform(({ value }) => value || 0)  
	discountMoney: number = 0                       // tiền giảm giá

	@Expose({ name: 'discount_percent' })
	@Transform(({ value }) => value || 0)  
	discountPercent: number = 0                     // % giảm giá

	@Expose({ name: 'discount_type' })
	discountType: DiscountType = DiscountType.Percent               // Loại giảm giá

	@Expose({ name: 'surcharge' })
	@Transform(({ value }) => value || 0)  
	surcharge: number = 0                           // phụ phí: tiền phải trả thêm: như tiền ship, tiền vé, hao phí xăng dầu

	@Expose({ name: 'total_money' })
	totalMoney: number = 0                          // tổng tiền = tiền sản phẩm + phụ phí - tiền giảm giá

	@Expose({ name: 'debt' })
	@Transform(({ value }) => value || 0)  
	debt: number = 0                                // tiền nợ

	@Expose({ name: 'note' })
	note: string

	@Expose({ name: 'receipt_items' })
	@Type(() => ReceiptItem)
	receiptItems: ReceiptItem[] = []

	@Expose({ name: 'distributor', toClassOnly: true })
	@Type(() => Distributor)
	distributor: Distributor

	static blank(): Receipt {
		return new Receipt()
	}

	static fromPlain(plain: Record<string, any>): Receipt {
		return plainToInstance(Receipt, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): Receipt[] {
		return plainToInstance(Receipt, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Receipt): Receipt {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}

	static toPlain(instance: Receipt, type: 'CREATE' | 'UPDATE'): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			groups: [type],
		})
	}
}
