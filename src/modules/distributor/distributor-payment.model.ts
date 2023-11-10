import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { PaymentType } from '../enum'

export class DistributorPayment extends BaseModel {
	@Expose({ name: 'distributor_id' })
	distributorId: number

	@Expose({ name: 'receipt_id' })
	receiptId: number

	@Expose({ name: 'time' })
	time: number

	@Expose({ name: 'type', toClassOnly: true })
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

	static blank(): DistributorPayment {
		return new DistributorPayment()
	}

	static fromPlain(plain: Record<string, any>): DistributorPayment {
		return plainToInstance(DistributorPayment, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): DistributorPayment[] {
		return plainToInstance(DistributorPayment, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: Partial<DistributorPayment>): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}
}
