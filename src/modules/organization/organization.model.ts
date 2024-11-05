import { User } from '../user'

export class Organization {
  id: number
  phone: string
  email: string
  emailVerify: 0 | 1
  dataVersion: number
  level: number
  name: string
  addressProvince: string
  addressDistrict: string
  addressWard: string
  addressStreet: string
  permissionIds: string
  isActive: 1 | 0 // Trạng thái

  note: string // Ghi chú
  expiryDate: number

  createdAt: number
  updatedAt: number
  deletedAt: number

  userList?: User[]

  static init(): Organization {
    const ins = new Organization()
    ins.id = 0
    ins.level = 1
    ins.emailVerify = 0
    ins.dataVersion = 1
    ins.isActive = 1
    return ins
  }

  static blank() {
    const ins = Organization.init()
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
    if (target.userList) {
      target.userList = User.basicList(target.userList)
    }
    return target
  }

  static fromList(sourceList: Organization[]) {
    return sourceList.map((i) => Organization.from(i))
  }
}
