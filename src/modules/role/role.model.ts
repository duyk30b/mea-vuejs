import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'

export class Role {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose()
  name: string

  @Expose()
  permissionIds: string

  @Expose()
  isActive: 0 | 1

  static init(): Role {
    const ins = new Role()
    ins.isActive = 1
    return ins
  }

  static blank(): Role {
    const ins = Role.init()
    return ins
  }

  static fromObject(object: Partial<Role>) {
    const ins = new Role()
    Object.assign(ins, object)
    return ins
  }

  static fromObjects(objects: Partial<Role>[]): Role[] {
    return objects.map((i) => Role.fromObject(i))
  }

  static fromPlain(plain: Record<string, any> = {}): Role {
    return plainToInstance(Role, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Role[] {
    return plainToInstance(Role, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: Role): Role {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Role') {
      throw new Error('Role.fromInstance error: Instance must be from class Role')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static fromInstances(instances: Role[]): Role[] {
    return instances.map((i) => Role.fromInstance(i))
  }

  static toPlain(
    instance: Role,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Role') {
      throw new Error('Role.fromInstance error: Instance must be from class Role')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
