import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { DebtType } from '../enum'

export class CustomerDebt extends BaseModel {
	@Expose({ name: 'customer_id' })
	customerId: number

	@Expose({ name: 'invoice_id', toClassOnly: true })
	invoiceId: number = 0

	@Expose({ name: 'type', toClassOnly: true })
	type: DebtType

	@Expose({ name: 'create_time', toClassOnly: true })
	createTime: number

	@Expose({ name: 'open_debt', toClassOnly: true })
	openDebt: number = 0                              // Dư nợ đầu kỳ

	@Expose({ name: 'money' })
	money: number = 0                                     // tiền nợ thêm hoặc trả nợ

	@Expose({ name: 'close_debt', toClassOnly: true })
	closeDebt: number = 0                              // Dư nợ cuối kỳ

	@Expose({ name: 'note' })
	note: string = ''

	static blank(): CustomerDebt {
		return new CustomerDebt()
	}

	static fromPlain(plain: Record<string, any>): CustomerDebt {
		return plainToInstance(CustomerDebt, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): CustomerDebt[] {
		return plainToInstance(CustomerDebt, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: Partial<CustomerDebt>): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}
}
