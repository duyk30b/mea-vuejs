import type { EGender } from '../enum'

export class Customer {
  id: number
  fullName: string
  customerSourceId: number
  phone?: string
  zalo?: string
  facebook?: string
  birthday?: number
  yearOfBirth?: number
  gender?: EGender
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

  static init(): Customer {
    const ins = new Customer()
    ins.id = 0
    ins.isActive = 1
    ins.customerSourceId = 0
    ins.debt = 0
    return ins
  }

  static blank(): Customer {
    const ins = Customer.init()
    return ins
  }

  static example(): Customer {
    const customer = Customer.blank()
    customer.fullName = 'Nguyễn Văn A'
    customer.phone = '0968123456'
    customer.birthday = new Date('1990-09-04').getTime()
    customer.gender = 1
    customer.addressProvince = 'Hà Nội'
    customer.addressDistrict = 'Long Biên'
    customer.addressWard = 'Thạch Bàn'
    return customer
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
