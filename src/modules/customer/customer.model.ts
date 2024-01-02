import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'
import type { EGender } from '../enum'

export class Customer {
  @Expose({ groups: ['ALL', 'COPY'] })
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

  @Expose({ groups: ['ALL', 'COPY'] })
  debt: number

  @Expose()
  note: string

  @Expose()
  isActive: 1 | 0 // Trạng thái

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

  static from(data: Partial<Customer>) {
    const ins = new Customer()
    Object.assign(ins, data)
    return ins
  }

  static fromPlain(plain: Record<string, any> = {}): Customer {
    return plainToInstance(Customer, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Customer[] {
    return plainToInstance(Customer, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: Customer): Customer {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static fromInstances(instances: Customer[]): Customer[] {
    return instanceToInstance(instances, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static toPlain(instance: Partial<Customer>): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['CREATE'],
    })
  }
}
