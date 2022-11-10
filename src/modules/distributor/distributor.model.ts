import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'

export class Distributor extends BaseModel {
	@Expose({ name: 'full_name_en' })
	fullNameEn: string = ''

	@Expose({ name: 'full_name_vi' })
	fullNameVi: string = ''

	@Expose({ name: 'phone' })
	phone?: string

	@Expose({ name: 'address_province' })
	addressProvince: string

	@Expose({ name: 'address_district' })
	addressDistrict: string

	@Expose({ name: 'address_ward' })
	addressWard: string

	@Expose({ name: 'address_street' })
	addressStreet: string

	@Expose({ name: 'debt', toClassOnly: true })
	debt: number = 0

	@Expose({ name: 'is_active' })
	isActive: boolean = true                            // Trạng thái

	@Expose({ name: 'note' })
	note: string

	static blank(): Distributor {
		return new Distributor()
	}

	static fromPlain(plain: Record<string, any>): Distributor {
		return plainToInstance(Distributor, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): Distributor[] {
		return plainToInstance(Distributor, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Distributor): Distributor {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}

	static toPlain(instance: Distributor): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}
}
