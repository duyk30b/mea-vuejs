import { Expose, instanceToInstance, instanceToPlain, plainToInstance } from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'

export class Distributor {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
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

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  debt: number

  @Expose()
  note?: string

  @Expose()
  isActive: 1 | 0 // Trạng thái

  @Expose({ groups: [FROM_PLAIN] })
  updatedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  deletedAt: number

  get addressString() {
    return [this.addressWard, this.addressDistrict, this.addressProvince]
      .filter((i) => !!i)
      .join(' - ')
      .replace('Tỉnh', '')
      .replace('Thành phố', '')
      .replace('Quận ', '')
      .replace('Huyện ', '')
      .replace('Phường ', '')
      .replace('Xã ', '')
  }

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

  static toBasic(root: Distributor) {
    const ins = new Distributor()
    Object.assign(ins, root)
    return ins
  }

  static toBasics(roots: Distributor[]) {
    return roots.map((i) => Distributor.toBasic(i))
  }

  static fromPlain(plain: Record<string, any> = {}): Distributor {
    return plainToInstance(Distributor, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[] = []): Distributor[] {
    return plainToInstance(Distributor, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(
    instance: Distributor,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Distributor') {
      throw new Error('Distributor.fromInstance error: Instance must be from class Distributor')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
