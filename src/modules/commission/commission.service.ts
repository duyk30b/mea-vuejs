import { arrayToKeyValue } from '../../utils'
import { CommissionApi } from './commission.api'
import type {
  CommissionDetailQuery,
  CommissionGetQuery,
  CommissionListQuery,
  CommissionPaginationQuery,
} from './commission.dto'
import { Commission } from './commission.model'

export class CommissionService {
  static loadedAll: boolean = false
  static commissionAll: Commission[] = []

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await CommissionApi.list({})
        CommissionService.commissionAll = data
      } catch (error: any) {
        console.log('🚀 ~ file: commission.service.ts:20 ~ fetchAll ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !CommissionService.loadedAll || options.refresh) {
        CommissionService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: Commission[], query: CommissionGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        if (filter.interactType != null) {
          if (filter.interactType !== i.interactType) {
            return false
          }
        }
        if (filter.interactId != null) {
          if (filter.interactId !== i.interactId) {
            return false
          }
        }
        if (filter.roleId != null) {
          if (filter.roleId !== i.roleId) {
            return false
          }
        }
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
      if (query.sort.interactType) {
        data.sort((a, b) => {
          if (query.sort?.interactType === 'ASC') return a.interactType < b.interactType ? -1 : 1
          if (query.sort?.interactType === 'DESC') return a.interactType > b.interactType ? -1 : 1
          return a.interactType > b.interactType ? -1 : 1
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
    await CommissionService.fetchAll()
    const commissionMap = arrayToKeyValue(CommissionService.commissionAll, 'id')
    return commissionMap
  }

  static async pagination(query: CommissionPaginationQuery, options?: { refresh: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await CommissionService.fetchAll({ refresh: !!options?.refresh })
    let data = CommissionService.executeQuery(CommissionService.commissionAll, query)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data: Commission.fromList(data),
      meta: { total: CommissionService.commissionAll.length },
    }
  }

  static async list(query: CommissionListQuery, options?: { refresh: boolean }) {
    await CommissionService.fetchAll({ refresh: !!options?.refresh })

    const data = CommissionService.executeQuery(CommissionService.commissionAll, query)
    return Commission.fromList(data)
  }

  static async detail(id: number, options: CommissionDetailQuery = {}) {
    const commission = await CommissionApi.detail(id, options)
    if (commission && options.relation) {
      const findIndex = CommissionService.commissionAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        CommissionService.commissionAll[findIndex] = commission
      }
    }
    return commission
  }

  static async createOne(commission: Commission) {
    const result = await CommissionApi.createOne(commission)
    CommissionService.loadedAll = false
    return result
  }

  static async updateOne(id: number, commission: Commission) {
    const result = await CommissionApi.updateOne(id, commission)
    CommissionService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await CommissionApi.destroyOne(id)
    CommissionService.loadedAll = false
    return result
  }

  static async replaceList(options: {
    filter: CommissionGetQuery['filter']
    commissionData: Commission[]
  }) {
    const result = await CommissionApi.replaceList(options)
    CommissionService.loadedAll = false
    return result
  }
}
