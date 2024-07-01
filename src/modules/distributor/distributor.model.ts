export class Distributor {
  id: number
  fullName: string
  phone?: string
  addressProvince?: string
  addressDistrict?: string
  addressWard?: string
  addressStreet?: string
  debt: number
  note?: string
  isActive: 1 | 0 // Trạng thái
  updatedAt: number
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

  static from(source: Distributor) {
    const target = new Distributor()
    Object.assign(target, source)
    return target
  }

  static fromList(sourceList: Distributor[]) {
    return sourceList.map((i) => Distributor.from(i))
  }
}
