import { ESArray } from '@/utils'
import { ref } from 'vue'
import { LaboratoryGroupApi } from './laboratory-group.api'
import type {
  LaboratoryGroupListQuery,
  LaboratoryGroupPaginationQuery,
} from './laboratory-group.dto'
import { LaboratoryGroup } from './laboratory-group.model'

export class LaboratoryGroupService {
  static loadedAll: boolean = false

  static laboratoryGroupAll: LaboratoryGroup[] = []
  static laboratoryGroupMap = ref<Record<string, LaboratoryGroup>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await LaboratoryGroupApi.list({ sort: { id: 'ASC' } })
        LaboratoryGroupService.laboratoryGroupAll = data
        LaboratoryGroupService.laboratoryGroupMap.value = ESArray.arrayToKeyValue(data, 'id')
      } catch (error: any) {
        console.log('🚀 ~ laboratory-group.service.ts:22 ~ LaboratoryGroupService ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !LaboratoryGroupService.loadedAll || options.refetch) {
        LaboratoryGroupService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  static async getMap(options?: { refetch: boolean }) {
    await LaboratoryGroupService.fetchAll({ refetch: !!options?.refetch })
    return LaboratoryGroupService.laboratoryGroupMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await LaboratoryGroupService.fetchAll({ refetch: !!options?.refetch })
    return LaboratoryGroupService.laboratoryGroupAll
  }

  static async pagination(options: LaboratoryGroupPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await LaboratoryGroupService.fetchAll()
    const dataQuery = LaboratoryGroupService.laboratoryGroupAll
    if (options.sort) {
      if (options.sort?.id) {
        dataQuery.sort((a, b) => {
          if (options.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (options.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: LaboratoryGroupListQuery, options?: { refetch: boolean }) {
    const filter = query.filter || {}
    await LaboratoryGroupService.fetchAll({ refetch: options?.refetch })
    let data = LaboratoryGroupService.laboratoryGroupAll
    if (query.filter) {
      data = data.filter((i) => {
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
    return LaboratoryGroup.fromList(data)
  }

  static async createOne(laboratoryGroup: LaboratoryGroup) {
    const result = await LaboratoryGroupApi.createOne(laboratoryGroup)
    LaboratoryGroupService.loadedAll = false
    return result
  }

  static async updateOne(id: number, laboratoryGroup: LaboratoryGroup) {
    const result = await LaboratoryGroupApi.updateOne(id, laboratoryGroup)
    LaboratoryGroupService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await LaboratoryGroupApi.destroyOne(id)
    LaboratoryGroupService.loadedAll = false
    return result
  }

  static async replaceAll(body: LaboratoryGroup[]) {
    const result = await LaboratoryGroupApi.replaceAll(body)
    LaboratoryGroupService.loadedAll = false
    return result
  }
}
