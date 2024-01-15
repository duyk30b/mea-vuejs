import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'

export class Distributor {
  @Expose({ groups: ['ALL', 'COPY'] })
  id: number

  @Expose()
  fullName: string

  @Expose()
  phone?: string

  @Expose()
  addressProvince?: string

  @Expose()
  addressDistrict?: string

  @Expose()
  addressWard?: string

  @Expose()
  addressStreet?: string

  @Expose({ groups: ['ALL', 'COPY'] })
  debt: number

  @Expose()
  note?: string

  @Expose()
  isActive: 1 | 0 // Trạng thái

  @Expose({ groups: ['ALL'] })
  createdAt: number

  @Expose({ groups: ['ALL'] })
  updatedAt: number

  @Expose({ groups: ['ALL'] })
  deletedAt: number

  static init(): Distributor {
    const ins = new Distributor()
    ins.id = 0
    ins.isActive = 1
    ins.debt = 0
    return ins
  }

  static blank(): Distributor {
    const ins = Distributor.init()
    return ins
  }

  static fromObject(object: Partial<Distributor>) {
    const ins = new Distributor()
    Object.assign(ins, object)
    return ins
  }

  static fromObjects(objects: Partial<Distributor>[]) {
    return objects.map((i) => Distributor.fromObject(i))
  }

  static fromPlain(plain: Record<string, any> = {}): Distributor {
    return plainToInstance(Distributor, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[] = []): Distributor[] {
    return plainToInstance(Distributor, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: Distributor): Distributor {
    if (instance?.constructor.name !== '_Distributor') {
      throw new Error('Distributor.fromInstance error: Instance must be from class Distributor')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static fromInstances(instances: Distributor[]): Distributor[] {
    return instances.map((i) => Distributor.fromInstance(i))
  }

  static toPlain(instance: Distributor): Record<string, any> {
    if (instance?.constructor.name !== '_Distributor') {
      throw new Error('Distributor.fromInstance error: Instance must be from class Distributor')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['CREATE'],
    })
  }
}
