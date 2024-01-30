import {
  Exclude,
  Expose,
  Transform,
  TransformationType,
  Type,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer'
import type { EGender } from '../enum'
import { Organization } from '../organization'
import { Role } from '../role/role.model'
import { decrypt } from '../../utils'
import {
  FROM_INSTANCE,
  FROM_PLAIN,
  ROOT_CREATE,
  ROOT_UPDATE,
  USER_CREATE,
  USER_UPDATE,
} from '../_base/base-expose'

export class User {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE] })
  oid: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE] })
  username: string

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, ROOT_CREATE, ROOT_UPDATE] })
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

  @Expose()
  roleId: number

  @Expose()
  birthday?: number

  @Expose()
  gender?: EGender

  @Expose()
  isActive: 1 | 0 // Trạng thái

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Role)
  role?: Role

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Organization)
  organization?: Organization

  static init(): User {
    const ins = new User()
    ins.id = 0
    ins.isActive = 1
    return ins
  }

  static blank(): User {
    const ins = User.init()
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
    type: typeof ROOT_CREATE | typeof ROOT_UPDATE | typeof USER_CREATE | typeof USER_UPDATE
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
