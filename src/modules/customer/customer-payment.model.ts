import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { PaymentType } from '../enum'

export class CustomerPayment extends BaseModel {
	@Expose({ name: 'customer_id' })
	customerId: number

	@Expose({ name: 'invoice_id' })
	invoiceId: number

	@Expose({ name: 'time' })
	time: number

	@Expose({ name: 'type' })
	type: PaymentType

	@Expose({ name: 'paid' })
	paid: number = 0                                 // Số tiền thanh toán

	@Expose({ name: 'open_debt' })
	openDebt: number = 0                              // Dư nợ đầu kỳ

	@Expose({ name: 'debit' })
	debit: number                                      // Ghi nợ: tiền nợ thêm hoặc trả nợ

	@Expose({ name: 'close_debt' })                    // openDebt + debit = closeDebt
	closeDebt: number = 0                              // Dư nợ cuối kỳ

	@Expose({ name: 'note' })
	note: string = ''

	@Expose({ name: 'description' })
	description: string = ''

	static blank(): CustomerPayment {
		return new CustomerPayment()
	}

	static fromPlain(plain: Record<string, any>): CustomerPayment {
		return plainToInstance(CustomerPayment, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): CustomerPayment[] {
		return plainToInstance(CustomerPayment, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: Partial<CustomerPayment>): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}
}
