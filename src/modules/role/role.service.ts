import { arrayToKeyValue } from '../../utils'
import { RoleApi } from './role.api'
import type { RoleDetailQuery, RoleGetQuery, RoleListQuery, RolePaginationQuery } from './role.dto'
import { Role } from './role.model'

export class RoleService {
  static loadedAll: boolean = false
  static roleAll: Role[] = []
  static roleDefault = Role.blank()

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng refresh: true
  static getAll = (() => {
    const start = async () => {
      try {
        RoleService.roleAll = await RoleApi.list({})
      } catch (error: any) {
        console.log('🚀 ~ file: role.service.ts:33 ~ :', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !RoleService.loadedAll || options.refresh) {
        RoleService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  static async getMap() {
    await RoleService.getAll()
    return arrayToKeyValue(RoleService.roleAll, 'id')
  }

  private static executeQuery(all: Role[], query: RoleGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        if (filter.isActive != null) {
          if (filter.isActive !== i.isActive) {
            return false
          }
        }
        return true
      })
    }
    if (query.sort) {
      if (query.sort?.id) {
        data.sort((a, b) => {
          if (query.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (query.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    return data
  }

  static async pagination(options: RolePaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await RoleService.getAll()
    let data = RoleService.executeQuery(RoleService.roleAll, options)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: RoleService.roleAll.length },
    }
  }

  static async list(options: RoleListQuery) {
    await RoleService.getAll()
    const data = RoleService.executeQuery(RoleService.roleAll, options)
    return Role.fromList(data)
  }

  static async detail(roleId: number, options: RoleDetailQuery = {}) {
    const result = await RoleApi.detail(roleId, options)
    const findIndex = RoleService.roleAll.findIndex((i) => {
      return i.id === roleId
    })
    if (findIndex !== -1) {
      RoleService.roleAll[findIndex] = result
    }
    return result
  }

  static async createOne(role: Role) {
    const result = await RoleApi.createOne(role)
    RoleService.loadedAll = false
    return result
  }

  static async updateOne(id: number, role: Role) {
    const result = await RoleApi.updateOne(id, role)
    RoleService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await RoleApi.destroyOne(id)
    if (result.success) {
      RoleService.loadedAll = false
    }
    return result
  }
}
