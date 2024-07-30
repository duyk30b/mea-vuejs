export class Distributor {
  id: number
  fullName: string
  phone?: string
  addressProvince: string
  addressDistrict: string
  addressWard: string
  addressStreet: string
  debt: number
  note?: string
  isActive: 1 | 0 // Trạng thái
  updatedAt: number
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

  static basic(source: Distributor) {
    const target = new Distributor()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Distributor[]): Distributor[] {
    return sources.map((i) => Distributor.basic(i))
  }

  static from(source: Distributor) {
    const target = Distributor.basic(source)
    return target
  }

  static fromList(sourceList: Distributor[]) {
    return sourceList.map((i) => Distributor.from(i))
  }
}
