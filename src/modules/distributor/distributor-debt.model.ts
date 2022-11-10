import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { DebtType } from '../enum'

export class DistributorDebt extends BaseModel {
	@Expose({ name: 'distributor_id' })
	distributorId: number

	@Expose({ name: 'receipt_id' })
	receiptId: number

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

	static blank(): DistributorDebt {
		return new DistributorDebt()
	}

	static fromPlain(plain: Record<string, any>): DistributorDebt {
		return plainToInstance(DistributorDebt, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): DistributorDebt[] {
		return plainToInstance(DistributorDebt, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: Partial<DistributorDebt>): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}
}
