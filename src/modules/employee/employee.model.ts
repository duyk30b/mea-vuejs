import { Exclude, Expose, instanceToInstance, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { EGender } from '../enum'

export class Employee extends BaseModel {
	@Expose({ name: 'username', toClassOnly: true })
	username: string = ''

	@Expose({ name: 'phone' })
	phone: string

	@Expose({ name: 'full_name' })
	fullName?: string

	@Expose({ name: 'birthday' })
	birthday?: number

	@Expose({ name: 'gender' })
	gender?: EGender

	static blank(): Employee {
		return new Employee()
	}

	static fromPlain(plain: Record<string, any>): Employee {
		return plainToInstance(Employee, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): Employee[] {
		return plainToInstance(Employee, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static toPlain(instance: Partial<Employee>): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Employee): Employee {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}
}
