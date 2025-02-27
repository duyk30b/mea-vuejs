import { User } from '../user'
import { UserRole } from '../user-role/user-role.model'

export class Role {
  id: number
  name: string
  displayName: string
  permissionIds: string
  isActive: 0 | 1
  updatedAt: number

  userRoleList?: UserRole[]

  static init(): Role {
    const ins = new Role()
    ins.isActive = 1
    return ins
  }

  static blank(): Role {
    const ins = Role.init()
    return ins
  }

  static basic(source: Role) {
    const target = new Role()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Role[]): Role[] {
    return sources.map((i) => Role.basic(i))
  }

  static from(source: Role) {
    const target = Role.basic(source)
    if (target.userRoleList) {
      target.userRoleList = UserRole.basicList(target.userRoleList)
      target.userRoleList.forEach((userRole) => {
        userRole.role = userRole.role ? Role.basic(userRole.role) : userRole.role
        userRole.user = userRole.user ? User.basic(userRole.user) : userRole.user
      })
    }
    return target
  }

  static fromList(sourceList: Role[]): Role[] {
    return sourceList.map((i) => Role.from(i))
  }
}
