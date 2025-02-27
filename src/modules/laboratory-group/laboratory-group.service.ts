import { arrayToKeyValue } from '../../utils'
import { LaboratoryGroupApi } from './laboratory-group.api'
import type {
  LaboratoryGroupListQuery,
  LaboratoryGroupPaginationQuery,
} from './laboratory-group.dto'
import { LaboratoryGroup } from './laboratory-group.model'

export class LaboratoryGroupService {
  static loadedAll: boolean = false

  static laboratoryGroupAll: LaboratoryGroup[] = []
  static laboratoryGroupMap: Record<string, LaboratoryGroup> = {}

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await LaboratoryGroupApi.list({ sort: { id: 'ASC' } })
        LaboratoryGroupService.laboratoryGroupAll = data
        LaboratoryGroupService.laboratoryGroupMap = arrayToKeyValue(data, 'id')
      } catch (error: any) {
        console.log('🚀 ~ laboratory-group.service.ts:22 ~ LaboratoryGroupService ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetchPromise || !LaboratoryGroupService.loadedAll || options.refresh) {
        LaboratoryGroupService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  static async getMap() {
    await LaboratoryGroupService.fetchAll()
    return LaboratoryGroupService.laboratoryGroupMap
  }

  static async pagination(options: LaboratoryGroupPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await LaboratoryGroupService.fetchAll()
    let data = LaboratoryGroupService.laboratoryGroupAll
    if (options.sort) {
      if (options.sort?.id) {
        data.sort((a, b) => {
          if (options.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (options.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: LaboratoryGroupService.laboratoryGroupAll.length },
    }
  }

  static async list(options: LaboratoryGroupListQuery) {
    const filter = options.filter || {}
    await LaboratoryGroupService.fetchAll()
    let data = LaboratoryGroupService.laboratoryGroupAll
    if (options.filter) {
      data = data.filter((i) => {
        return true
      })
    }
    if (options.sort) {
      if (options.sort?.id) {
        data.sort((a, b) => {
          if (options.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (options.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
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
