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

  static from(source: Partial<Customer>) {
    const target = new Customer()
    Object.assign(target, source)
    return target
  }

  static fromList(sourceList: Partial<Customer>[]): Customer[] {
    return sourceList.map((i) => Customer.from(i))
  }
}
