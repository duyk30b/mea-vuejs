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
        const userRoleAll = await UserRoleApi.list()

        const userRoleMapList: Record<string, UserRole[]> = {}
        UserRoleService.userRoleAll.forEach((i) => {
          const key = i.roleId
          if (!userRoleMapList[key]) userRoleMapList[key] = []
          userRoleMapList[key].push(i)
        })

        UserRoleService.userRoleAll = userRoleAll
        UserRoleService.userRoleMapList.value = userRoleMapList
      } catch (error: any) {
        console.log('🚀 ~ user-role.service.ts:27 ~ UserRoleService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !UserRoleService.loadedAll || options.refetch) {
        fetching = start()
        UserRoleService.loadedAll = true
      }
      await fetching
    }
  })()

  static async getMapList(options?: { refetch: boolean }) {
    await UserRoleService.fetchAll({ refetch: !!options?.refetch })
    return UserRoleService.userRoleMapList.value
  }

  static async list(options?: { refetch: boolean }) {
    await UserRoleService.fetchAll({ refetch: !!options?.refetch })
    return UserRole.fromList(UserRoleService.userRoleAll)
  }

  static async getAll(options?: { refetch: boolean }) {
    await UserRoleService.fetchAll({ refetch: !!options?.refetch })
    return UserRoleService.userRoleAll
  }
}
