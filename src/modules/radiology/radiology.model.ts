import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { BaseModel } from '../base.model'

export class Radiology extends BaseModel {
  @Expose()
  name: string // Tên dịch vụ

  @Expose()
  price: number // Giá dự kiến

  @Expose()
  default: string // Tóm tăt bệnh án

  @Expose({ groups: [FROM_PLAIN] })
  updatedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  deletedAt: number

  static init() {
    const ins = new Radiology()
    ins.id = 0
    ins.price = 0
    return ins
  }

  static blank() {
    const ins = Radiology.init()
    return ins
  }

  static toBasic(root: Radiology) {
    const ins = new Radiology()
    Object.assign(ins, root)
    return ins
  }

  static fromPlain(plain: Record<string, any>): Radiology {
    return plainToInstance(Radiology, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Radiology[] {
    return plainToInstance(Radiology, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(
    instance: Radiology,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Radiology') {
      throw new Error('Radiology.fromInstance error: Instance must be from class Radiology')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
