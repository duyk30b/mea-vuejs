import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'

export class Organization extends BaseModel {
	@Expose({ name: 'organization_name' })
	organizationName: string

	@Expose({ name: 'email', toClassOnly: true })
	email: string

	@Expose({ name: 'phone', toClassOnly: true })
	phone: string

	@Expose({ name: 'level', toClassOnly: true })
	level: number

	@Expose({ name: 'address_province' })
	addressProvince: string

	@Expose({ name: 'address_district' })
	addressDistrict: string

	@Expose({ name: 'address_ward' })
	addressWard: string

	@Expose({ name: 'address_street' })
	addressStreet: string

	static blank() {
		return new Organization()
	}

	static fromPlain(plain: Record<string, any>): Organization {
		return plainToInstance(Organization, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: Partial<Organization>): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Organization): Organization {
		const result = new Organization()
		Object.assign(result, instance)
		return result
	}
}
