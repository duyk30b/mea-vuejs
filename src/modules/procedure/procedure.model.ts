import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'

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

  @Expose({ groups: [FROM_PLAIN] })
  updatedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  deletedAt: number

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

  static toBasic(root: Procedure) {
    const ins = new Procedure()
    Object.assign(ins, root)
    return ins
  }

  static fromObject(object: Partial<Procedure>) {
    const ins = new Procedure()
    Object.assign(ins, object)
    return ins
  }

  static fromObjects(objects: Partial<Procedure>[]): Procedure[] {
    return objects.map((i) => Procedure.fromObject(i))
  }

  static fromPlain(plain: Record<string, any>): Procedure {
    return plainToInstance(Procedure, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Procedure[] {
    return plainToInstance(Procedure, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: Procedure): Procedure {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Procedure') {
      throw new Error('Procedure.fromInstance error: Instance must be from class Procedure')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static toPlain(
    instance: Procedure,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Procedure') {
      throw new Error('Procedure.fromInstance error: Instance must be from class Procedure')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }

  static clone(instance: Procedure): Procedure {
    const procedure = Procedure.fromInstance(instance)
    return procedure
  }
}
