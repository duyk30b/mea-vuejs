import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Transform, Type } from 'class-transformer'
import { Arrival } from '../arrival'
import { BaseModel } from '../base.model'
import { Customer } from '../customer'
import { DiscountType, type PaymentStatus } from '../enum'
import { InvoiceItem } from './invoice-item.model'

export class Invoice extends BaseModel {
	@Expose({ name: 'arrival_id', toClassOnly: true })
	arrivalId: number

	@Expose({ name: 'customer_id', toClassOnly: true })
	customerId: number

	@Expose({ name: 'payment_status', toClassOnly: true })
	paymentStatus: PaymentStatus

	@Expose({ name: 'payment_time', toClassOnly: true })
	paymentTime: number

	@Expose({ name: 'refund_time', toClassOnly: true })
	refundTime: number

	@Expose({ name: 'total_cost_money' })
	totalCostMoney: number = 0				          // tổng tiền cost = tổng cost sản phẩm   

	@Expose({ name: 'total_item_money' })
	totalItemMoney: number = 0                        // totalItemProduct + totalItemProcedure

	@Expose({ name: 'discount_money' })
	@Transform(({ value }) => value || 0)
	discountMoney: number = 0                         // tiền giảm giá

	@Expose({ name: 'discount_percent' })
	@Transform(({ value }) => value || 0)
	discountPercent: number = 0                       // % giảm giá

	@Expose({ name: 'discount_type' })
	discountType: DiscountType = DiscountType.Percent                            // Loại giảm giá

	@Expose({ name: 'surcharge' })
	@Transform(({ value }) => value || 0)
	surcharge: number = 0                             // phụ phí

	@Expose({ name: 'total_money' })
	totalMoney: number                                        // Doanh thu = totalItemMoney + phụ phí - tiền giảm giá

	@Expose({ name: 'expenses' })
	@Transform(({ value }) => value || 0)                         // Mục này sinh ra để tính lãi cho chính xác, nghĩa là để trừ cả các chi phí sinh ra khi tạo đơn
	expenses: number = 0                                   // Mục này sẽ không hiện trong đơn hàng, khách hàng ko nhìn thấy

	@Expose({ name: 'profit' })
	@Transform(({ value }) => value || 0)
	profit: number                                            // tiền lãi = Doanh thu - tiền cost - khoản chi

	@Expose({ name: 'debt' })
	@Transform(({ value }) => value || 0)
	debt: number = 0                            // tiền nợ

	@Expose({ name: 'note' })
	note: string = ''                               // Ghi chú

	@Expose({ name: 'customer', toClassOnly: true })
	@Type(() => Customer)
	customer?: Customer

	@Expose({ name: 'arrival' })
	@Type(() => Arrival)
	arrival: Arrival

	@Expose({ name: 'invoice_items' })
	@Type(() => InvoiceItem)
	invoiceItems: InvoiceItem[] = []

	static blank(): Invoice {
		return new Invoice()
	}

	static fromPlain(dto: Record<string, any>): Invoice {
		return plainToInstance(Invoice, dto, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(dto: Record<string, any>[]): Invoice[] {
		return plainToInstance(Invoice, dto, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: Invoice): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Invoice): Invoice {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}
}
