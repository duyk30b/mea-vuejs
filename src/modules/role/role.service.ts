import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ESArray } from '@/utils'
import { ref } from 'vue'
import { UserRoleService } from '../user-role'
import { RoleApi } from './role.api'
import type { RoleDetailQuery, RoleGetQuery, RoleListQuery, RolePaginationQuery } from './role.dto'
import { Role } from './role.model'

const RoleDBQuery = new IndexedDBQuery<Role>()

export class RoleService {
  static loadedAll: boolean = false
  static roleAll: Role[] = []
  static roleMap = ref<Record<string, Role>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng refetch: true
  static fetchAll = (() => {
    const start = async () => {
      try {
        const roleAll = await RoleApi.list({})
        RoleService.roleAll = roleAll
        RoleService.roleMap.value = ESArray.arrayToKeyValue(roleAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ role.service.ts:21 ~ RoleService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !RoleService.loadedAll || options.refetch) {
        RoleService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  static async getMap(options?: { refetch: boolean }) {
    await RoleService.fetchAll({ refetch: !!options?.refetch })
    return RoleService.roleMap.value
  }

  private static executeQuery(all: Role[], query: RoleGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return RoleDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = RoleDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async pagination(options: RolePaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await RoleService.fetchAll()
    let data = RoleService.executeQuery(RoleService.roleAll, options)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: RoleService.roleAll.length },
    }
  }

  static async list(options: RoleListQuery) {
    await RoleService.fetchAll()
    const data = RoleService.executeQuery(RoleService.roleAll, options)
    return Role.fromList(data)
  }

  static async detail(
    id: number,
    query: RoleDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let role: Role | undefined
    if (options?.query) {
      role = await RoleApi.detail(id, query)
      const findIndex = RoleService.roleAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) RoleService.roleAll[findIndex] = role
      RoleService.roleMap.value[role.id] = role
    } else {
      await RoleService.fetchAll({ refetch: !!options?.refetch })
      role = RoleService.roleAll.find((i) => i.id === id)
    }

    return role ? Role.from(role) : Role.blank()
  }

  static async createOne(role: Role, userIdList: number[]) {
    const result = await RoleApi.createOne(role, userIdList)
    RoleService.loadedAll = false
    UserRoleService.loadedAll = false
    return result
  }

  static async updateOne(id: number, role: Role, userIdList: number[]) {
    const result = await RoleApi.updateOne(id, role, userIdList)
    RoleService.loadedAll = false
    UserRoleService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await RoleApi.destroyOne(id)
    if (result.success) {
      RoleService.loadedAll = false
      UserRoleService.loadedAll = false
    }
    return result
  }
}
