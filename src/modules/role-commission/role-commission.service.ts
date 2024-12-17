import { arrayToKeyValue } from '../../utils'
import { RoleCommissionApi } from './role-commission.api'
import type {
  RoleCommissionGetQuery,
  RoleCommissionListQuery,
  RoleCommissionPaginationQuery,
} from './role-commission.dto'
import { RoleCommission } from './role-commission.model'

export class RoleCommissionService {
  static loadedAll: boolean = false
  static roleCommissionAll: RoleCommission[] = []

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static getAll = (() => {
    const start = async () => {
      try {
        const { data } = await RoleCommissionApi.list({})
        RoleCommissionService.roleCommissionAll = data
      } catch (error: any) {
        console.log('🚀 ~ file: roleCommission.service.ts:20 ~ getAll ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !RoleCommissionService.loadedAll || options.refresh) {
        RoleCommissionService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: RoleCommission[], query: RoleCommissionGetQuery) {
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
      if (query.sort.roleInteractType) {
        data.sort((a, b) => {
          if (query.sort?.roleInteractType === 'ASC')
            return a.roleInteractType < b.roleInteractType ? -1 : 1
          if (query.sort?.roleInteractType === 'DESC')
            return a.roleInteractType > b.roleInteractType ? -1 : 1
          return a.roleInteractType > b.roleInteractType ? -1 : 1
        })
      }
      if (query.sort.roleId) {
        data.sort((a, b) => {
          if (query.sort?.roleId === 'ASC') return a.roleId < b.roleId ? -1 : 1
          if (query.sort?.roleId === 'DESC') return a.roleId > b.roleId ? -1 : 1
          return a.roleId > b.roleId ? -1 : 1
        })
      }
    }
    return data
  }

  static async getMap() {
    await RoleCommissionService.getAll()
    const roleCommissionMap = arrayToKeyValue(RoleCommissionService.roleCommissionAll, 'id')
    return roleCommissionMap
  }

  static async pagination(query: RoleCommissionPaginationQuery, options?: { refresh: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await RoleCommissionService.getAll({ refresh: !!options?.refresh })
    let data = RoleCommissionService.executeQuery(RoleCommissionService.roleCommissionAll, query)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: RoleCommissionService.roleCommissionAll.length },
    }
  }

  static async list(query: RoleCommissionListQuery) {
    await RoleCommissionService.getAll()

    const data = RoleCommissionService.executeQuery(RoleCommissionService.roleCommissionAll, query)
    return RoleCommission.fromList(data)
  }

  static async createOne(roleCommission: RoleCommission) {
    const result = await RoleCommissionApi.createOne(roleCommission)
    RoleCommissionService.loadedAll = false
    return result
  }

  static async updateOne(id: number, roleCommission: RoleCommission) {
    const result = await RoleCommissionApi.updateOne(id, roleCommission)
    RoleCommissionService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await RoleCommissionApi.destroyOne(id)
    RoleCommissionService.loadedAll = false
    return result
  }
}
