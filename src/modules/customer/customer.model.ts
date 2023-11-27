import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { EGender } from '../enum'

export class Customer extends BaseModel {
  @Expose()
  fullName: string = ''

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

  @Expose({ toClassOnly: true })
  debt: number = 0

  @Expose()
  note: string

  @Expose()
  isActive: boolean = true // Trạng thái

  static blank(): Customer {
    return new Customer()
  }

  static fromPlain(plain: Record<string, any>): Customer {
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

  static toPlain(instance: Partial<Customer>): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }

  static fromInstance(instance: Customer): Customer {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      ignoreDecorators: true,
    })
  }
}
