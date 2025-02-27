import { arrayToKeyValue, customFilter } from '../../utils'
import { LaboratoryApi } from './laboratory.api'
import type {
  LaboratoryGetQuery,
  LaboratoryListQuery,
  LaboratoryPaginationQuery,
} from './laboratory.dto'
import { Laboratory } from './laboratory.model'

export class LaboratoryService {
  static loadedAll: boolean = false
  static laboratoryAll: Laboratory[] = []
  static laboratoryFlatMap: Record<string, Laboratory> = {}

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const data = await LaboratoryApi.list({ sort: { priority: 'ASC' } })
        const laboratoryList = data.filter((i) => i.level === 1)
        const laboratoryMap = arrayToKeyValue(laboratoryList, 'id')
        data.forEach((i) => {
          try {
            i.optionsParse = JSON.parse(i.options)
          } catch (error) {
            i.optionsParse = []
          }
          if (!laboratoryMap[i.parentId].children) {
            laboratoryMap[i.parentId].children = []
          }
          if (i.level === 2) {
            laboratoryMap[i.parentId].children?.push(i)
          }
        })
        LaboratoryService.laboratoryAll = laboratoryList
        LaboratoryService.laboratoryFlatMap = arrayToKeyValue(data, 'id')
      } catch (error: any) {
        console.log('🚀 ~ file: laboratory.service.ts:35 ~ LaboratoryService ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetchPromise || !LaboratoryService.loadedAll || options.refresh) {
        LaboratoryService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: Laboratory[], query: LaboratoryGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        if (filter.laboratoryGroupId != null) {
          if (filter.laboratoryGroupId !== i.laboratoryGroupId) {
            return false
          }
        }
        if (filter.level != null) {
          if (filter.level !== i.level) {
            return false
          }
        }
        if (filter.parentId != null) {
          if (filter.parentId !== i.parentId) {
            return false
          }
        }
        if (filter.name) {
          if (filter.name.LIKE && !customFilter(i.name || '', filter.name.LIKE, 2)) {
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
      if (query.sort.priority) {
        data.sort((a, b) => {
          if (query.sort?.priority === 'ASC') return a.priority < b.priority ? -1 : 1
          if (query.sort?.priority === 'DESC') return a.priority > b.priority ? -1 : 1
          return a.priority > b.priority ? -1 : 1
        })
      }
    }
    return data
  }

  static async getMap() {
    await LaboratoryService.fetchAll()
    const laboratoryMap = arrayToKeyValue(LaboratoryService.laboratoryAll, 'id')
    return laboratoryMap
  }

  static async getFlatMap() {
    await LaboratoryService.fetchAll()
    return LaboratoryService.laboratoryFlatMap
  }

  static async pagination(query: LaboratoryPaginationQuery, options?: { refresh: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await LaboratoryService.fetchAll({ refresh: !!options?.refresh })

    let data = LaboratoryService.executeQuery(LaboratoryService.laboratoryAll, query)
    data = data.slice((page - 1) * limit, page * limit)

    return {
      data: Laboratory.fromList(data),
      meta: { total: LaboratoryService.laboratoryAll.length },
    }
  }

  static async list(query: LaboratoryListQuery, options?: { refresh: boolean }) {
    await LaboratoryService.fetchAll({ refresh: !!options?.refresh })
    const data = LaboratoryService.executeQuery(LaboratoryService.laboratoryAll, query)

    return Laboratory.fromList(data)
  }

  static async create(laboratory: Laboratory) {
    const result = await LaboratoryApi.create(laboratory)
    LaboratoryService.loadedAll = false
    return result
  }

  static async update(id: number, laboratory: Laboratory) {
    const result = await LaboratoryApi.update(id, laboratory)
    LaboratoryService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await LaboratoryApi.destroyOne(id)
    if (result.success) {
      LaboratoryService.loadedAll = false
    }
    return result
  }

  static async systemCopy(body: { laboratoryIdList: number[] }) {
    const result = await LaboratoryApi.systemCopy(body)
    LaboratoryService.loadedAll = false
    return result
  }
}
