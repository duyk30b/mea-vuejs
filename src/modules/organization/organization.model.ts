import {
  Expose,
  Type,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer'
import { User } from '../user'
import {
  FROM_INSTANCE,
  FROM_PLAIN,
  ROOT_CREATE,
  ROOT_UPDATE,
  USER_CREATE,
  USER_UPDATE,
} from '../_base/base-expose'

export class Organization {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number | null

  @Expose()
  name: string

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE] })
  email: string

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE] })
  phone: string

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE] })
  level: number

  @Expose()
  addressProvince: string

  @Expose()
  addressDistrict: string

  @Expose()
  addressWard: string

  @Expose()
  addressStreet: string

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE] })
  permissionIds: string

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE] })
  isActive: 1 | 0 // Trạng thái

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => User)
  users: User[]

  static init(): Organization {
    const ins = new Organization()
    ins.id = null // id = 0 là Root rồi
    ins.level = 1
    return ins
  }

  static blank() {
    const ins = Organization.init()
    return ins
  }

  static fromObject(object: Partial<Organization>) {
    const ins = new Organization()
    Object.assign(ins, object)
    return ins
  }

  static fromObjects(objects: Partial<Organization>[]): Organization[] {
    return objects.map((i) => Organization.fromObject(i))
  }

  static fromPlain(plain: Record<string, any>): Organization {
    return plainToInstance(Organization, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Organization[] {
    return plainToInstance(Organization, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: Organization): Organization {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Organization') {
      throw new Error('Organization.fromInstance error: Instance must be from class Organization')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static fromInstances(instances: Organization[]): Organization[] {
    return instances.map((i) => Organization.fromInstance(i))
  }

  static toPlain(
    instance: Partial<Organization>,
    type: typeof ROOT_CREATE | typeof ROOT_UPDATE | typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Organization') {
      throw new Error('Organization.fromInstance error: Instance must be from class Organization')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
