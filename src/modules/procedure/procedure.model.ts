import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'

export class Procedure extends BaseModel {
	@Expose({ name: 'name_vi' })
	nameVi: string                                             // Tên dịch vụ

	@Expose({ name: 'name_en' })
	nameEn: string                                             // Tên dịch vụ

	@Expose({ name: 'group' })
	group: string = ''                                         // Nhóm dịch vụ ...

	@Expose({ name: 'price' })
	price: number = 0                                          // Giá dự kiến

	@Expose({ name: 'consumable_hint' })
	consumableHint: string                                     // Gợi ý vậy tư tiêu hao

	@Expose({ name: 'is_active' })
	isActive: boolean = true                                   // Trạng thái

	static blank(): Procedure {
		return new Procedure()
	}

	static fromPlain(plain: Record<string, any>): Procedure {
		return plainToInstance(Procedure, plain, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromPlains(plains: Record<string, any>[]): Procedure[] {
		return plainToInstance(Procedure, plains, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}

	static fromInstance(instance: Procedure): Procedure {
		return instanceToInstance(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
			ignoreDecorators: true,
		})
	}

	static toPlain(instance: Procedure): Record<string, any> {
		return instanceToPlain(instance, {
			exposeUnsetFields: false,
			excludeExtraneousValues: true,
		})
	}
}
