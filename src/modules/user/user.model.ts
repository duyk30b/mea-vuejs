import type { EGender } from '../enum'
import { Image } from '../image/image.model'
import { Organization } from '../organization'
import { Role } from '../role/role.model'
import { Room } from '../room'
import { UserRole } from '../user-role/user-role.model'
import { UserRoom } from '../user-room'
import Device from './device.model'

export class User {
  oid: number
  id: number
  username: string
  password: string
  secret: string

  fullName: string
  phone: string
  birthday?: number
  gender?: EGender

  imageIds: string
  isAdmin: 1 | 0 // Trạng thái
  isActive: 1 | 0 // Trạng thái

  updatedAt: number
  deletedAt: number

  userRoleList?: UserRole[]
  userRoomList?: UserRoom[]
  organization?: Organization
  devices?: Device[]
  imageList: Image[]

  static init(): User {
    const ins = new User()
    ins.id = 0
    ins.isActive = 1
    ins.isAdmin = 0
    return ins
  }

  static blank(): User {
    const ins = User.init()
    ins.imageList = []
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
        // target.password = decrypt(target.secret, target.username)
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
    if (Object.prototype.hasOwnProperty.call(source, 'organization')) {
      target.organization = target.organization
        ? Organization.basic(target.organization)
        : target.organization
    }
    if (target.userRoleList) {
      target.userRoleList = UserRole.basicList(target.userRoleList)
      target.userRoleList.forEach((userRole) => {
        userRole.role = userRole.role ? Role.basic(userRole.role) : userRole.role
        // userRole.user = userRole.user ? User.basic(userRole.user) : userRole.user
      })
    }
    if (target.userRoomList) {
      target.userRoomList = UserRoom.basicList(target.userRoomList)
      target.userRoomList.forEach((userRoom) => {
        userRoom.room = userRoom.room ? Room.basic(userRoom.room) : userRoom.room
        // userRoom.user = userRoom.user ? User.basic(userRoom.user) : userRoom.user
      })
    }
    if (target.devices) {
      target.devices = Device.basicList(target.devices)
    }
    if (target.imageList) {
      target.imageList = Image.basicList(target.imageList)
    }
    return target
  }

  static fromList(sourceList: User[]) {
    return sourceList.map((i) => User.from(i))
  }

  static equal(a: User, b: User) {
    if (a.id != b.id) return false
    // if (a.username != b.username) return false
    // if (a.password != b.password) return false

    if (a.fullName != b.fullName) return false
    if (a.phone != b.phone) return false

    if (a.birthday != b.birthday) return false
    if (a.gender != b.gender) return false

    if (a.isAdmin != b.isAdmin) return false
    if (a.isActive != b.isActive) return false
    return true
  }
}
