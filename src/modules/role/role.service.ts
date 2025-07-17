import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ESArray } from '@/utils'
import { ref } from 'vue'
import { UserRole, UserRoleService } from '../user-role'
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

  static async getAll(options?: { refetch: boolean }) {
    await RoleService.fetchAll({ refetch: !!options?.refetch })
    return RoleService.roleAll
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

  static async executeRelation(roleList: Role[], relation: RoleGetQuery['relation']) {
    try {
      const roleIdList = roleList.map((i) => i.id)

      const [userRoleAll] = await Promise.all([
        relation?.userRoleList ? UserRoleService.getAll() : <UserRole[]>[],
      ])

      roleList.forEach((role) => {
        if (relation?.userRoleList) {
          role.userRoleList = userRoleAll.filter((i) => {
            return i.roleId === role.id
          })
        }
      })
    } catch (error) {
      console.log('🚀 ~ role.service.ts:77 ~ RoleService ~ executeRelation ~ error:', error)
    }
  }

  static async pagination(query: RolePaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await RoleService.fetchAll({ refetch: !!options?.refetch })
    const dataQuery = RoleService.executeQuery(RoleService.roleAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)

    if (query.relation) {
      await RoleService.executeRelation(data, query.relation)
    }
    return {
      data,
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: RoleListQuery, options?: { refetch: boolean }) {
    await RoleService.fetchAll({ refetch: !!options?.refetch })
    const data = RoleService.executeQuery(RoleService.roleAll, query)
    if (query.relation) {
      await RoleService.executeRelation(data, query.relation)
    }
    return Role.fromList(data)
  }

  static async detail(
    roleId: number,
    query: RoleDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let role: Role | undefined
    if (options?.query) {
      role = await RoleApi.detail(roleId, query)
      const findIndex = RoleService.roleAll.findIndex((i) => i.id === roleId)
      if (findIndex !== -1) {
        Object.assign(RoleService.roleAll[findIndex], role)
        Object.assign(RoleService.roleMap.value[roleId], role)
      }
    } else {
      await RoleService.fetchAll({ refetch: !!options?.refetch })
      role = RoleService.roleMap.value[roleId]
      if (query.relation) {
        await RoleService.executeRelation([role!], query.relation)
      }
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
