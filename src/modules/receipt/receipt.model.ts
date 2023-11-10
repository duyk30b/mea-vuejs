import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Transform, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Distributor, DistributorPayment } from '../distributor'
import { DiscountType } from '../enum'
import { ReceiptItem } from './receipt-item.model'

export enum ReceiptStatus {
	Refund = -1,
	Draft = 0,
	AwaitingShipment = 1, // Chờ gửi hàng
	Debt = 2,
	Success = 3
}

export class Receipt extends BaseModel {
	@Expose({ name: 'distributor_id', groups: ['CREATE'] })
	distributorId: number

	@Expose({ name: 'status', toClassOnly: true })
	status: ReceiptStatus

	@Expose({ name: 'create_time' })
	createTime: number

	@Expose({ name: 'delete_time', toClassOnly: true })
	deleteTime: number

	@Expose({ name: 'total_item_money' })
	totalItemMoney: number = 0                      // tiền sản phẩm

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

	@Expose({ name: 'paid', toClassOnly: true })
	@Transform(({ value }) => value || 0)
	paid: number = 0

	@Expose({ name: 'debt', toClassOnly: true })
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

	@Expose({ name: 'distributor_payments', toClassOnly: true })
	distributorPayments: DistributorPayment[] = []

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
