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
  isActive: 1 | 0 // Trạng thái

  static init() {
    const ins = new Procedure()
    ins.id = 0
    ins.price = 0
    ins.isActive = 1
    return ins
  }

  static blank() {
    const ins = Procedure.init()
    return ins
  }

  static from(data: Partial<Procedure>) {
    const ins = new Procedure()
    Object.assign(ins, data)
    return ins
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
