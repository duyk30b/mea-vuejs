import type { EGender } from '../enum'

export class Customer {
  id: number
  fullName: string
  phone?: string
  birthday?: number
  gender?: EGender
  identityCard?: string // số căn cước
  addressProvince: string
  addressDistrict: string
  addressWard: string
  addressStreet: string
  relative?: string // người thân
  healthHistory?: string // Tiền sử bệnh
  debt: number
  note: string
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

  static init(): Customer {
    const ins = new Customer()
    ins.id = 0
    ins.isActive = 1
    ins.debt = 0
    return ins
  }

  static blank(): Customer {
    const ins = Customer.init()
    return ins
  }

  static basic(source: Customer) {
    const target = new Customer()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Customer[]): Customer[] {
    return sources.map((i) => Customer.basic(i))
  }

  static from(source: Customer) {
    const target = Customer.basic(source)
    return target
  }

  static fromList(sourceList: Customer[]): Customer[] {
    return sourceList.map((i) => Customer.from(i))
  }
}
