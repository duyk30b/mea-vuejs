import { Image } from '../image/image.model'
import { User } from '../user'
import { OrganizationPayment } from './organization-payment.model'

export enum OrganizationStatus {
  Inactive = 0,
  Active = 1,
  Frequent = 2,
}

export class Organization {
  id: number
  organizationCode: string
  phone: string
  email: string
  emailVerify: 0 | 1
  level: number

  permissionIds: string
  status: OrganizationStatus

  facebook: string // Facebook
  name: string
  addressProvince: string
  addressWard: string
  addressStreet: string

  note: string // Ghi chú
  expiryDate: number

  dataVersion: string
  dataVersionParse: { product: number; batch: number; customer: number }

  createdAt: number
  updatedAt: number
  deletedAt: number

  logoImage?: Image
  organizationPaymentList?: OrganizationPayment[]
  userList?: User[]

  static init(): Organization {
    const ins = new Organization()
    ins.id = 0
    ins.level = 1
    ins.emailVerify = 0
    ins.dataVersion = '{}'
    ins.status = OrganizationStatus.Active
    return ins
  }

  static blank() {
    const ins = Organization.init()
    ins.organizationPaymentList = []
    return ins
  }

  static basic(source: Organization) {
    const target = new Organization()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Organization[]): Organization[] {
    return sources.map((i) => Organization.basic(i))
  }

  static from(source: Organization) {
    const target = Organization.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'logoImage')) {
      target.logoImage = target.logoImage ? Image.basic(target.logoImage) : target.logoImage
    }
    if (target.userList) {
      target.userList = User.basicList(target.userList)
    }
    if (target.organizationPaymentList) {
      target.organizationPaymentList = OrganizationPayment.basicList(target.organizationPaymentList)
    }
    return target
  }

  static fromList(sourceList: Organization[]) {
    return sourceList.map((i) => Organization.from(i))
  }

  static equal(a: Organization, b: Organization) {
    if (a.id != b.id) return false
    if (a.organizationCode != b.organizationCode) return false
    if (a.phone != b.phone) return false
    if (a.email != b.email) return false
    if (a.emailVerify != b.emailVerify) return false
    if (a.level != b.level) return false

    if (a.permissionIds != b.permissionIds) return false
    if (a.status != b.status) return false

    if (a.facebook != b.facebook) return false
    if (a.name != b.name) return false
    if (a.addressProvince != b.addressProvince) return false
    if (a.addressWard != b.addressWard) return false
    if (a.addressStreet != b.addressStreet) return false

    if (a.note != b.note) return false
    if (a.expiryDate != b.expiryDate) return false
    
    if (a.dataVersion != b.dataVersion) return false
    if (a.createdAt != b.createdAt) return false
    if (a.updatedAt != b.updatedAt) return false
    if (a.deletedAt != b.deletedAt) return false
    return true
  }
}
