import { ref } from 'vue'
import { ESArray } from '../../utils'
import { UserRoleService } from '../user-role'
import { UserApi } from './user.api'
import type { UserDetailQuery, UserGetQuery, UserListQuery, UserPaginationQuery } from './user.dto'
import { User } from './user.model'

export class UserService {
  static loadedAll: boolean = false
  static userAll: User[] = []
  static userMap = ref<Record<string, User>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static fetchAll = (() => {
    const start = async () => {
      try {
        const userAll = await UserApi.list({})
        UserService.userAll = userAll
        UserService.userMap.value = ESArray.arrayToKeyValue(UserService.userAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ file: user.service.ts:20 ~ fetchAll ~ error:', error)
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

  static async getAll(options?: { refetch: boolean }) {
    await UserService.fetchAll({ refetch: !!options?.refetch })
    return UserService.userAll
  }

  static async getMap(options?: { refetch: boolean }) {
    await UserService.fetchAll({ refetch: !!options?.refetch })
    return UserService.userMap.value
  }

  static async pagination(query: UserPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await UserService.fetchAll({ refetch: !!options?.refetch })
    const dataQuery = UserService.executeQuery(UserService.userAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: UserListQuery) {
    await UserService.fetchAll()
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
