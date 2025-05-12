import { ref } from 'vue'
import { UserRoleApi } from './user-role.api'
import { UserRole } from './user-role.model'

export class UserRoleService {
  static loadedAll: boolean = false
  static userRoleAll: UserRole[] = []

  static userRoleMapList = ref<Record<string, UserRole[]>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static fetchAll = (() => {
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

  static async reloadMap() {
    await UserRoleService.fetchAll()
    let result: Record<string, UserRole[]> = {}
    UserRoleService.userRoleAll.forEach((i) => {
      const key = i.roleId
      if (!result[key]) result[key] = []
      result[key].push(i)
    })

    UserRoleService.userRoleMapList.value = result
  }

  static async list() {
    await UserRoleService.fetchAll()
    return UserRole.fromList(UserRoleService.userRoleAll)
  }
}
