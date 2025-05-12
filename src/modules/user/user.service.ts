import { ref } from 'vue'
import { arrayToKeyValue } from '../../utils'
import { UserRoleService } from '../user-role'
import { UserApi } from './user.api'
import type { UserDetailQuery, UserGetQuery, UserListQuery, UserPaginationQuery } from './user.dto'
import { User } from './user.model'

export class UserService {
  static loadedAll: boolean = false
  static userAll: User[] = []
  static userMap = ref<Record<string, User>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static getAll = (() => {
    const start = async () => {
      try {
        UserService.userAll = await UserApi.list({})
      } catch (error: any) {
        console.log('🚀 ~ file: user.service.ts:20 ~ getAll ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !UserService.loadedAll || options.refetch) {
        UserService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: User[], query: UserGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return true
      })
    }
    if (query.sort) {
      if (query.sort.id) {
        data.sort((a, b) => {
          if (query.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (query.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    return data
  }

  static async reloadMap() {
    await UserService.getAll()
    UserService.userMap.value = arrayToKeyValue(UserService.userAll, 'id')
  }

  static async getMap() {
    await UserService.getAll()
    const userMap = arrayToKeyValue(UserService.userAll, 'id')
    return userMap
  }

  static async pagination(query: UserPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await UserService.getAll({ refetch: !!options?.refetch })
    let data = UserService.executeQuery(UserService.userAll, query)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: UserService.userAll.length },
    }
  }

  static async list(query: UserListQuery) {
    await UserService.getAll()
    const data = UserService.executeQuery(UserService.userAll, query)
    return User.fromList(data)
  }

  static async detail(userId: number, query: UserDetailQuery = {}, options?: { refetch: boolean }) {
    let user: User | undefined
    const index = UserService.userAll.findIndex((i) => i.id === userId)
    if (options?.refetch) {
      user = await UserApi.detail(userId, query)
      if (index !== -1) {
        UserService.userAll[index] = user
      } else {
        UserService.userAll.push(user)
      }
    } else {
      user = UserService.userAll[index]
    }
    return user
  }

  static async createOne(user: User, roleIdList: number[]) {
    const result = await UserApi.createOne(user, roleIdList)
    UserService.loadedAll = false
    UserRoleService.loadedAll = false
    return result
  }

  static async updateOne(id: number, user: User, roleIdList: number[]) {
    const result = await UserApi.updateOne(id, user, roleIdList)
    UserService.loadedAll = false
    UserRoleService.loadedAll = false
    return result
  }

  static async deleteOne(id: number) {
    const result = await UserApi.deleteOne(id)
    UserService.loadedAll = false
    UserRoleService.loadedAll = false
    return result
  }
}
