import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import type { EGender } from '../enum'

export class Customer {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose()
  fullName: string

  @Expose()
  phone?: string

  @Expose()
  birthday?: number

  @Expose()
  gender?: EGender

  @Expose() // số căn cước
  identityCard?: string

  @Expose()
  addressProvince: string

  @Expose()
  addressDistrict: string

  @Expose()
  addressWard: string

  @Expose()
  addressStreet: string

  @Expose() // người thân
  relative?: string

  @Expose()
  healthHistory?: string // Tiền sử bệnh

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  debt: number

  @Expose()
  note: string

  @Expose()
  isActive: 1 | 0 // Trạng thái

  @Expose({ groups: [FROM_PLAIN] })
  createdAt: number

  @Expose({ groups: [FROM_PLAIN] })
  updatedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  deletedAt: number

  static init(): Customer {
    const ins = new Customer()
    ins.id = 0
    ins.isActive = 1
    ins.debt = 0
    return ins
  }

  static blank(): Customer {
    const ins = Customer.init()
    return ins
  }

  static fromObject(object: Partial<Customer>) {
    const ins = new Customer()
    Object.assign(ins, object)
    return ins
  }

  static fromObjects(objects: Partial<Customer>[]): Customer[] {
    return objects.map((i) => Customer.fromObject(i))
  }

  static fromPlain(plain: Record<string, any> = {}): Customer {
    return plainToInstance(Customer, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Customer[] {
    return plainToInstance(Customer, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: Customer): Customer {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Customer') {
      throw new Error('Customer.fromInstance error: Instance must be from class Customer')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static fromInstances(instances: Customer[]): Customer[] {
    return instances.map((i) => Customer.fromInstance(i))
  }

  static toPlain(
    instance: Customer,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Customer') {
      throw new Error('Customer.fromInstance error: Instance must be from class Customer')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
