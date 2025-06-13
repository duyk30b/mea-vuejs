import { arrayToKeyValue } from '../../utils'
import { PositionApi } from './position.api'
import type {
  PositionDetailQuery,
  PositionGetQuery,
  PositionListQuery,
  PositionPaginationQuery,
} from './position.dto'
import { Position } from './position.model'

export class PositionService {
  static loadedAll: boolean = false
  static positionAll: Position[] = []

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await PositionApi.list({})
        PositionService.positionAll = data
      } catch (error: any) {
        console.log('🚀 ~ file: commission.service.ts:20 ~ fetchAll ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !PositionService.loadedAll || options.refresh) {
        PositionService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: Position[], query: PositionGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        if (filter.positionType != null) {
          if (filter.positionType !== i.positionType) {
            return false
          }
        }
        if (filter.positionInteractId != null) {
          if (filter.positionInteractId !== i.positionInteractId) {
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
      if (query.sort.positionType) {
        data.sort((a, b) => {
          if (query.sort?.positionType === 'ASC') return a.positionType < b.positionType ? -1 : 1
          if (query.sort?.positionType === 'DESC') return a.positionType > b.positionType ? -1 : 1
          return a.positionType > b.positionType ? -1 : 1
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
    await PositionService.fetchAll()
    const commissionMap = arrayToKeyValue(PositionService.positionAll, 'id')
    return commissionMap
  }

  static async pagination(query: PositionPaginationQuery, options?: { refresh: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await PositionService.fetchAll({ refresh: !!options?.refresh })
    let data = PositionService.executeQuery(PositionService.positionAll, query)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data: Position.fromList(data),
      meta: { total: PositionService.positionAll.length },
    }
  }

  static async list(query: PositionListQuery, options?: { refresh: boolean }) {
    await PositionService.fetchAll({ refresh: !!options?.refresh })

    const data = PositionService.executeQuery(PositionService.positionAll, query)
    return Position.fromList(data)
  }

  static async detail(id: number, options: PositionDetailQuery = {}) {
    const commission = await PositionApi.detail(id, options)
    if (commission && options.relation) {
      const findIndex = PositionService.positionAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        PositionService.positionAll[findIndex] = commission
      }
    }
    return commission
  }

  static async createOne(commission: Position) {
    const result = await PositionApi.createOne(commission)
    PositionService.loadedAll = false
    return result
  }

  static async updateOne(id: number, commission: Position) {
    const result = await PositionApi.updateOne(id, commission)
    PositionService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await PositionApi.destroyOne(id)
    PositionService.loadedAll = false
    return result
  }

  static async replaceList(options: {
    filter: PositionGetQuery['filter']
    positionData: Position[]
  }) {
    const result = await PositionApi.replaceList(options)
    PositionService.loadedAll = false
    return result
  }
}
