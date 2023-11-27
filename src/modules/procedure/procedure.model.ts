import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'

export class Procedure extends BaseModel {
  @Expose()
  name: string // Tên dịch vụ

  @Expose()
  group: string = '' // Nhóm dịch vụ ...

  @Expose()
  price: number = 0 // Giá dự kiến

  @Expose()
  consumableHint: string // Gợi ý vậy tư tiêu hao

  @Expose()
  isActive: boolean = true // Trạng thái

  static blank(): Procedure {
    return new Procedure()
  }

  static fromPlain(plain: Record<string, any>): Procedure {
    return plainToInstance(Procedure, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Procedure[] {
    return plainToInstance(Procedure, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
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
