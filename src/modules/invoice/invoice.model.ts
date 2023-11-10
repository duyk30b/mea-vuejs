import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Transform, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Customer, CustomerPayment } from '../customer'
import { DiscountType, type ExpensesDetailType, type SurchargeDetailType } from '../enum'
import { InvoiceItem } from './invoice-item.model'

export enum InvoiceStatus {
	Refund = -1,
	Draft = 0,
	AwaitingShipment = 1,
	Debt = 2,
	Success = 3
}

export class Invoice extends BaseModel {
	@Expose({ name: 'arrival_id', toClassOnly: true })
	arrivalId: number

	@Expose({ name: 'customer_id', groups: ['CREATE'] })
	customerId: number

	@Expose({ name: 'status', toClassOnly: true })
	status: InvoiceStatus

	@Expose({ name: 'create_time' })
	createTime: number

	@Expose({ name: 'delete_time', toClassOnly: true })
	deleteTime: number

	@Expose({ name: 'total_cost_money' })
	totalCostMoney: number = 0				                // tổng tiền cost = tổng cost sản phẩm   

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

	@Expose({ name: 'surcharge_details' })
	surchargeDetails: SurchargeDetailType[] = [{ key: '_unknown', money: 0, name: '' }]   // Phụ phí chi tiết

	@Expose({ name: 'expenses_details' })
	expensesDetails: ExpensesDetailType[] = [{ key: '_unknown', money: 0, name: '' }]   // Chi phí chi tiết

	@Expose({ name: 'profit' })
	@Transform(({ value }) => value || 0)
	profit: number                                            // tiền lãi = Doanh thu - tiền cost - khoản chi

	@Expose({ name: 'paid', toClassOnly: true })
	@Transform(({ value }) => value || 0)
	paid: number = 0                                          // tiền đã thanh toán

	@Expose({ name: 'debt', toClassOnly: true })
	@Transform(({ value }) => value || 0)
	debt: number = 0                                          // tiền nợ

	@Expose({ name: 'note' })
	note: string = ''                                         // Ghi chú

	// @Expose({ name: 'arrival' })
	// @Type(() => Arrival)
	// arrival: Arrival

	@Expose({ name: 'invoice_items' })
	@Type(() => InvoiceItem)
	invoiceItems: InvoiceItem[] = []

	@Expose({ name: 'customer', toClassOnly: true })
	@Type(() => Customer)
	customer?: Customer

	@Expose({ name: 'customer_payments', toClassOnly: true })
	customerPayments: CustomerPayment[] = []

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

	static fromInstance(instance: Invoice): Invoice {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}

	static toPlain(instance: Invoice, type: 'CREATE' | 'UPDATE'): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			groups: [type],
		})
	}
}
