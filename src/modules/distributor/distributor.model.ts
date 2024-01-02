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
  isActive: 1 | 0 // Trạng thái

  @Expose()
  note?: string

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

  static from(data: Partial<Distributor>) {
    const ins = new Distributor()
    Object.assign(ins, data)
    return ins
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
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static fromInstances(instances: Distributor[]): Distributor[] {
    return instanceToInstance(instances, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static toPlain(instance: Distributor): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['CREATE'],
    })
  }
}
