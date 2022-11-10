import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { Diagnosis } from '../diagnosis/diagnosis.model'
import { Customer } from '../customer'
import type { ArrivalStatus, ArrivalType, PaymentStatus } from '../enum'
import { Invoice } from '../invoice'
import { BaseModel } from '../base.model'

export class Arrival extends BaseModel {
	@Expose({ name: 'customer_id' })
	customerId?: number

	@Expose({ name: 'diagnosis_id' })
	diagnosisId?: number

	@Expose({ name: 'type' })
	type: ArrivalType

	@Expose({ name: 'status' })
	status: ArrivalStatus

	@Expose({ name: 'payment_status', toClassOnly: true })
	paymentStatus: PaymentStatus

	@Expose({ name: 'create_time' })
	createTime: number // Giờ vào khám

	@Expose({ name: 'end_time' })
	endTime: number // Giờ kết thúc khám

	@Expose({ name: 'total_money' })
	totalMoney: number                                        // tổng tiền 

	@Expose({ name: 'profit' })
	profit: number

	@Expose({ name: 'debt' })
	debt: number                                              // tiền nợ

	@Expose({ name: 'customer' })
	@Type(() => Customer)
	customer?: Customer

	@Expose({ name: 'arrival_diagnosis' })
	@Type(() => Diagnosis)
	diagnosis?: Diagnosis

	@Expose({ name: 'invoices' })
	@Type(() => Invoice)
	invoices: Invoice[] = []

	static blank(): Arrival {
		const arrival = new Arrival()
		arrival.customer = new Customer()
		return arrival
	}

	static fromPlain(plain: Record<string, any>): Arrival {
		return plainToInstance(Arrival, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): Arrival[] {
		return plainToInstance(Arrival, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: Arrival): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Arrival): Arrival {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}
}
