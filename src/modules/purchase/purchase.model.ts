import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Distributor } from '../distributor/distributor.model'
import type { PaymentStatus } from '../enum'
import { Receipt } from '../receipt'

export class Purchase extends BaseModel {
	@Expose({ name: 'distributor_id' })
	distributorId: number

	@Expose({ name: 'payment_status' })
	paymentStatus: PaymentStatus

	@Expose({ name: 'create_time', toClassOnly: true })
	createTime: number

	@Expose({ name: 'total_money', toClassOnly: true })
	@Type(() => Number) // totalNumber là dạng bigInt
	totalMoney: number

	@Expose({ name: 'debt', toClassOnly: true })
	debt: number = 0

	@Expose({ name: 'distributor', toClassOnly: true })
	@Type(() => Distributor)
	distributor?: Distributor

	@Expose({ name: 'receipts' })
	@Type(() => Receipt)
	receipts: Receipt[] = []

	static blank(): Purchase {
		return new Purchase()
	}

	static fromPlain(plain: Record<string, any>): Purchase {
		return plainToInstance(Purchase, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): Purchase[] {
		return plainToInstance(Purchase, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Purchase): Purchase {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}

	static toPlain(instance: Purchase): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}
}
