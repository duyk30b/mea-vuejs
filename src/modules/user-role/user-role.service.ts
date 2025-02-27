import { UserRoleApi } from './user-role.api'
import { UserRole } from './user-role.model'

export class UserRoleService {
  static loadedAll: boolean = false
  static userRoleAll: UserRole[] = []

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static getAll = (() => {
    const start = async () => {
      try {
        UserRoleService.userRoleAll = await UserRoleApi.list()
      } catch (error: any) {
        console.log('🚀 ~ file: user-role.service.ts:16 ~ UserRoleService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !UserRoleService.loadedAll || options.refresh) {
        fetching = start()
        UserRoleService.loadedAll = true
      }
      await fetching
    }
  })()

  static async list() {
    await UserRoleService.getAll()
    return UserRole.fromList(UserRoleService.userRoleAll)
  }
}
