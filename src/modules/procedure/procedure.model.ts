import {
  Expose,
  Transform,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer'
import { BaseModel } from '../base.model'

export class Procedure extends BaseModel {
  @Expose()
  name: string // Tên dịch vụ

  @Expose()
  group: string // Nhóm dịch vụ ...

  @Expose()
  price: number // Giá dự kiến

  @Expose()
  consumableHint: string // Gợi ý vậy tư tiêu hao

  @Expose()
  @Transform(({ value, type }) => (value != null ? value : 1))
  isActive: 1 | 0 // Trạng thái

  static blank(): Procedure {
    const instance = Procedure.fromInstance(new Procedure())
    return instance
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
      groups: ['COPY'],
    })
  }

  static toPlain(instance: Procedure, type: 'CREATE' | 'UPDATE'): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
