import { ref } from 'vue'
import { ESArray } from '../../utils'
import { RadiologyGroupApi } from './radiology-group.api'
import type { RadiologyGroupListQuery, RadiologyGroupPaginationQuery } from './radiology-group.dto'
import { RadiologyGroup } from './radiology-group.model'

export class RadiologyGroupService {
  static loadedAll: boolean = false
  static radiologyGroupAll: RadiologyGroup[] = []
  static radiologyGroupMap = ref<Record<string, RadiologyGroup>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await RadiologyGroupApi.list({ sort: { id: 'ASC' } })
        const radiologyGroupAll = data
        RadiologyGroupService.radiologyGroupAll = radiologyGroupAll
        RadiologyGroupService.radiologyGroupMap.value = ESArray.arrayToKeyValue(
          radiologyGroupAll,
          'id',
        )
      } catch (error: any) {
        console.log('🚀 ~ radiology-group.service.ts:20 ~ fetchAll ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !RadiologyGroupService.loadedAll || options.refetch) {
        RadiologyGroupService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  static async getAll(options?: { refetch: boolean }) {
    await RadiologyGroupService.fetchAll({ refetch: !!options?.refetch })
    return RadiologyGroupService.radiologyGroupAll
  }

  static async getMap(options?: { refetch: boolean }) {
    await RadiologyGroupService.fetchAll({ refetch: !!options?.refetch })
    return RadiologyGroupService.radiologyGroupMap.value
  }

  static async pagination(query: RadiologyGroupPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await RadiologyGroupService.fetchAll({ refetch: options?.refetch })
    let data = RadiologyGroupService.radiologyGroupAll
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: RadiologyGroupService.radiologyGroupAll.length },
    }
  }

  static async list(query: RadiologyGroupListQuery, options?: { refetch: boolean }) {
    await RadiologyGroupService.fetchAll({ refetch: options?.refetch })
    let data = RadiologyGroupService.radiologyGroupAll
    if (query.filter) {
      const filter = query.filter || {}
      data = data.filter((i) => {
        return true
      })
    }
    return RadiologyGroup.fromList(data)
  }

  static async createOne(radiologyGroup: RadiologyGroup) {
    const result = await RadiologyGroupApi.createOne(radiologyGroup)
    RadiologyGroupService.loadedAll = false
    return result
  }

  static async updateOne(id: number, radiologyGroup: RadiologyGroup) {
    const result = await RadiologyGroupApi.updateOne(id, radiologyGroup)
    RadiologyGroupService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await RadiologyGroupApi.destroyOne(id)
    RadiologyGroupService.loadedAll = false
    return result
  }

  static async replaceAll(body: RadiologyGroup[]) {
    const result = await RadiologyGroupApi.replaceAll(body)
    RadiologyGroupService.loadedAll = false
    return result
  }
}
