import { decrypt } from '../../utils'
import type { EGender } from '../enum'
import { Organization } from '../organization'
import { Role } from '../role/role.model'
import Device from './device.model'

export class User {
  oid: number
  id: number | null
  username: string
  password: string
  secret: string
  fullName: string
  phone: string
  roleId: number
  birthday?: number
  gender?: EGender
  isActive: 1 | 0 // Trạng thái
  updatedAt: number
  deletedAt: number

  role?: Role
  organization?: Organization
  devices?: Device[]

  static init(): User {
    const ins = new User()
    ins.id = null // UserId = 0 là ROOT
    ins.isActive = 1
    ins.roleId = 1
    return ins
  }

  static blank(): User {
    const ins = User.init()
    return ins
  }

  static basic(source: User) {
    const target = new User()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    if (target.secret && !target.password) {
      try {
        target.password = decrypt(target.secret, target.username)
      } catch (error) {
        console.log('🚀 ~ file: user.model.ts:117 ~ User ~ basic ~ error:', error)
      }
    }
    return target
  }

  static basicList(sources: User[]): User[] {
    return sources.map((i) => User.basic(i))
  }

  static from(source: User) {
    const target = User.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'role')) {
      target.role = target.role ? Role.basic(target.role) : target.role
    }
    if (Object.prototype.hasOwnProperty.call(source, 'organization')) {
      target.organization = target.organization
        ? Organization.basic(target.organization)
        : target.organization
    }
    if (target.devices) {
      target.devices = Device.basicList(target.devices)
    }
    return target
  }

  static fromList(sourceList: User[]) {
    return sourceList.map((i) => User.from(i))
  }
}
