import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { PositionApi } from './position.api'
import type {
    PositionDetailQuery,
    PositionGetQuery,
    PositionListQuery,
    PositionPaginationQuery,
} from './position.dto'
import { Position } from './position.model'

const PositionDBQuery = new IndexedDBQuery<Position>()

export class PositionService {
  static loadedAll: boolean = false
  static positionAll: Position[] = []
  static positionMap = ref<Record<string, Position>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await PositionApi.list({})
        const positionAll = data
        PositionService.positionAll = positionAll
        PositionService.positionMap.value = ESArray.arrayToKeyValue(positionAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ position.service.ts:26 ~ PositionService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !PositionService.loadedAll || options.refetch) {
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
        return PositionDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = PositionDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async getMap(options?: { refetch: boolean }) {
    await PositionService.fetchAll({ refetch: !!options?.refetch })
    return PositionService.positionMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await PositionService.fetchAll({ refetch: !!options?.refetch })
    return PositionService.positionAll
  }

  static async pagination(query: PositionPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await PositionService.fetchAll({ refetch: !!options?.refetch })
    const dataQuery = PositionService.executeQuery(PositionService.positionAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      data: Position.fromList(data),
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: PositionListQuery, options?: { refetch: boolean }) {
    await PositionService.fetchAll({ refetch: !!options?.refetch })

    const data = PositionService.executeQuery(PositionService.positionAll, query)
    return Position.fromList(data)
  }

  static async detail(id: number, options: PositionDetailQuery = {}) {
    const position = await PositionApi.detail(id, options)
    if (position && options.relation) {
      const findIndex = PositionService.positionAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        PositionService.positionAll[findIndex] = position
      }
    }
    return position
  }

  static async createOne(position: Position) {
    const result = await PositionApi.createOne(position)
    PositionService.loadedAll = false
    return result
  }

  static async updateOne(id: number, position: Position) {
    const result = await PositionApi.updateOne(id, position)
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
