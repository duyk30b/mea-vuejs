import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'

export class Organization extends BaseModel {
  @Expose()
  organizationName: string

  @Expose({ toClassOnly: true })
  email: string

  @Expose({ toClassOnly: true })
  phone: string

  @Expose({ toClassOnly: true })
  level: number

  @Expose()
  addressProvince: string

  @Expose()
  addressDistrict: string

  @Expose()
  addressWard: string

  @Expose()
  addressStreet: string

  static blank() {
    return new Organization()
  }

  static fromPlain(plain: Record<string, any>): Organization {
    return plainToInstance(Organization, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static toPlain(instance: Partial<Organization>): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: Organization): Organization {
    const result = new Organization()
    Object.assign(result, instance)
    return result
  }
}
