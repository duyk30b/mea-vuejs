import type { EGender } from '../enum'

export class Customer {
  id: number
  customerCode: string
  fullName: string
  customerSourceId: number
  phone?: string
  zalo?: string
  facebook?: string
  birthday?: number
  yearOfBirth?: number
  gender?: EGender
  addressProvince: string
  addressWard: string
  addressStreet: string
  relative?: string // người thân
  healthHistory?: string // Tiền sử bệnh
  debt: number
  note: string
  isActive: 1 | 0 // Trạng thái
  updatedAt: number

  get getAge() {
    const nowYear = new Date().getFullYear()
    if (this.yearOfBirth) {
      return nowYear - this.yearOfBirth
    }
    if (this.birthday) {
      const birthdayYear = new Date(this.birthday).getFullYear()
      return nowYear - birthdayYear
    }
    return undefined
  }

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
    ins.customerCode = ''
    return ins
  }

  static example(): Customer {
    const customer = Customer.blank()
    customer.fullName = 'Nguyễn Văn A'
    customer.phone = '0968123456'
    customer.birthday = new Date('1990-09-04').getTime()
    customer.gender = 1
    customer.addressProvince = 'Hà Nội'
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

  static from(source?: Customer) {
    const target = source ? Customer.basic(source) : Customer.blank()
    return target
  }

  static fromList(sourceList: Customer[]): Customer[] {
    return sourceList.map((i) => Customer.from(i))
  }
}
