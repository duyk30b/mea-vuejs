import {
  Expose,
  Transform,
  TransformationType,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer'

export class Role {
  @Expose({ groups: ['ALL', 'COPY'] })
  id: number

  @Expose()
  name: string

  @Expose()
  @Transform(({ value, type }) => {
    if (type === TransformationType.PLAIN_TO_CLASS) {
      return JSON.parse(value || JSON.stringify([4, 5, 6]))
    } else if (type === TransformationType.CLASS_TO_PLAIN) {
      return JSON.stringify(value || [4, 5, 6])
    } else if (type === TransformationType.CLASS_TO_CLASS) {
      return JSON.parse(JSON.stringify(value || [4, 5, 6]))
    }
    return value
  })
  permissionIds: number[]

  @Expose()
  isActive: 0 | 1

  static init(): Role {
    const ins = new Role()
    ins.id = 0
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
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Role[] {
    return plainToInstance(Role, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: Role): Role {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Role') {
      throw new Error('Role.fromInstance error: Instance must be from class Role')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static fromInstances(instances: Role[]): Role[] {
    return instances.map((i) => Role.fromInstance(i))
  }

  static toPlain(instance: Role, type: 'CREATE' | 'UPDATE'): Record<string, any> {
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
