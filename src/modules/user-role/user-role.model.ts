import { Role } from '../role/role.model'
import { User } from '../user/user.model'

export class UserRole {
  oid: number
  id: number | null

  userId: number
  roleId: number

  role?: Role
  user?: User

  static init(): UserRole {
    const ins = new UserRole()
    ins.id = 0
    return ins
  }

  static blank(): UserRole {
    const ins = UserRole.init()
    return ins
  }

  static basic(source: UserRole) {
    const target = new UserRole()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: UserRole[]): UserRole[] {
    return sources.map((i) => UserRole.basic(i))
  }

  static from(source: UserRole) {
    const target = UserRole.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'user')) {
      target.user = target.user ? User.basic(target.user) : target.user
    }
    if (Object.prototype.hasOwnProperty.call(source, 'role')) {
      target.role = target.role ? Role.basic(target.role) : target.role
    }

    return target
  }

  static fromList(sourceList: UserRole[]) {
    return sourceList.map((i) => UserRole.from(i))
  }
}
