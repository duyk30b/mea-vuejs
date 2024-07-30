import { arrayToKeyValue } from '../../utils'
import { RadiologyGroupApi } from './radiology-group.api'
import type { RadiologyGroupListQuery, RadiologyGroupPaginationQuery } from './radiology-group.dto'
import { RadiologyGroup } from './radiology-group.model'

export class RadiologyGroupService {
  static loadedAll: boolean = false
  static radiologyGroupAll: RadiologyGroup[]

  private static async getAll() {
    if (RadiologyGroupService.loadedAll) return
    const { data } = await RadiologyGroupApi.list({ sort: { id: 'ASC' } })
    RadiologyGroupService.radiologyGroupAll = data
    RadiologyGroupService.loadedAll = true
  }

  static async getMap() {
    await RadiologyGroupService.getAll()
    return arrayToKeyValue(RadiologyGroupService.radiologyGroupAll, 'id')
  }

  static async pagination(options: RadiologyGroupPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await RadiologyGroupService.getAll()
    let data = RadiologyGroupService.radiologyGroupAll
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: RadiologyGroupService.radiologyGroupAll.length },
    }
  }

  static async list(options: RadiologyGroupListQuery) {
    await RadiologyGroupService.getAll()
    let data = RadiologyGroupService.radiologyGroupAll
    if (options.filter) {
      const filter = options.filter || {}
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
