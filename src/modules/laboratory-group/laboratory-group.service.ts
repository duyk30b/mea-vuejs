import { LaboratoryGroupApi } from './laboratory-group.api'
import type { LaboratoryGroupPaginationQuery } from './laboratory-group.dto'
import type { LaboratoryGroup } from './laboratory-group.model'

export class LaboratoryGroupService {
  static loadedAll: boolean = false
  static laboratoryGroupAll: LaboratoryGroup[]

  static async getAll() {
    if (!LaboratoryGroupService.loadedAll) {
      const fetchData = await LaboratoryGroupApi.list({ sort: { id: 'ASC' } })
      LaboratoryGroupService.laboratoryGroupAll = fetchData.data
      LaboratoryGroupService.loadedAll = true
    }

    return LaboratoryGroupService.laboratoryGroupAll
  }

  static async pagination(options: LaboratoryGroupPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await LaboratoryGroupService.getAll()
    const data = LaboratoryGroupService.laboratoryGroupAll.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: LaboratoryGroupService.laboratoryGroupAll.length },
    }
  }

  static async replaceAll(body: LaboratoryGroup[]) {
    const result = await LaboratoryGroupApi.replaceAll(body)
    LaboratoryGroupService.loadedAll = false
    return result
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
}
