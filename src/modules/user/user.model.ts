import {
  Expose,
  Transform,
  Type,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer'
import { decrypt } from '../../utils'
import {
  ADMIN_CREATE,
  ADMIN_UPDATE,
  FROM_INSTANCE,
  FROM_PLAIN,
  ROOT_CREATE,
  ROOT_UPDATE,
  USER_CREATE,
  USER_UPDATE,
} from '../_base/base-expose'
import type { EGender } from '../enum'
import { Organization } from '../organization'
import { Role } from '../role/role.model'
import Device from './device.model'

export class User {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE] })
  oid: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number | null

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE, ADMIN_CREATE] })
  username: string

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE, ADMIN_CREATE] })
  @Transform((params) => {
    const { value, type, obj, key, options } = params
    if (!Array.isArray(options.groups)) return value
    if (options.groups[0] === FROM_PLAIN) {
      try {
        return decrypt(obj.secret, obj.username)
      } catch (error) {
        return value
      }
    }
    return value
  })
  password: string

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  secret: string

  @Expose()
  fullName: string

  @Expose()
  phone: string

  @Expose({
    groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE, ADMIN_CREATE, ADMIN_UPDATE],
  })
  roleId: number

  @Expose()
  birthday?: number

  @Expose()
  gender?: EGender

  @Expose({
    groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE, ADMIN_CREATE, ADMIN_UPDATE],
  })
  isActive: 1 | 0 // Trạng thái

  @Expose({ groups: [FROM_PLAIN] })
  updatedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  deletedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Role)
  role?: Role

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Organization)
  organization?: Organization

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Device)
  devices?: Device[]

  static init(): User {
    const ins = new User()
    ins.id = null // UserId = 0 là ROOT
    ins.isActive = 1
    ins.roleId = 1
    return ins
  }

  static blank(): User {
    const ins = User.init()
    return ins
  }

  static toBasic(root: User) {
    const ins = new User()
    Object.assign(ins, root)
    delete ins.role
    delete ins.organization
    delete ins.devices
    return ins
  }

  static fromObject(object: Partial<User>) {
    const ins = new User()
    Object.assign(ins, object)
    return ins
  }

  static fromObjects(objects: Partial<User>[]): User[] {
    return objects.map((i) => User.fromObject(i))
  }

  static fromPlain(plain: Record<string, any> = {}): User {
    return plainToInstance(User, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): User[] {
    return plainToInstance(User, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: User): User {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_User') {
      throw new Error('User.fromInstance error: Instance must be from class User')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static fromInstances(instances: User[]): User[] {
    return instances.map((i) => User.fromInstance(i))
  }

  static toPlain(
    instance: User,
    type:
      | typeof ROOT_CREATE
      | typeof ROOT_UPDATE
      | typeof ADMIN_CREATE
      | typeof ADMIN_UPDATE
      | typeof USER_CREATE
      | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_User') {
      throw new Error('User.fromInstance error: Instance must be from class User')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
