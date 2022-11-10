import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { EGender } from '../enum'
import { CustomerDebt } from './customer-debt.model'

export class Customer extends BaseModel {
	@Expose({ name: 'full_name_en' })
	fullNameEn: string = ''

	@Expose({ name: 'full_name_vi' })
	fullNameVi: string = ''

	@Expose({ name: 'phone' })
	phone?: string

	@Expose({ name: 'birthday' })
	birthday?: number

	@Expose({ name: 'gender' })
	gender?: EGender

	@Expose({ name: 'identity_card' })              // số căn cước
	identityCard?: string

	@Expose({ name: 'address_province' })
	addressProvince: string

	@Expose({ name: 'address_district' })
	addressDistrict: string

	@Expose({ name: 'address_ward' })
	addressWard: string

	@Expose({ name: 'address_street' })
	addressStreet: string

	@Expose({ name: 'relative' })                   // người thân
	relative?: string

	@Expose({ name: 'health_history' })
	healthHistory?: string // Tiền sử bệnh

	@Expose({ name: 'debt', toClassOnly: true })
	debt: number = 0

	@Expose({ name: 'note' })
	note: string

	@Expose({ name: 'is_active' })
	isActive: boolean = true                            // Trạng thái

	@Expose({ name: 'customer_debts', toClassOnly: true })
	@Type(() => CustomerDebt)
	customerDebts: CustomerDebt[] = []

	static blank(): Customer {
		return new Customer()
	}

	static fromPlain(plain: Record<string, any>): Customer {
		return plainToInstance(Customer, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): Customer[] {
		return plainToInstance(Customer, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: Partial<Customer>): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Customer): Customer {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}
}
