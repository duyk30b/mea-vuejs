import { arrayToKeyValue } from '../../utils'
import { LaboratoryGroupApi } from './laboratory-group.api'
import type {
  LaboratoryGroupListQuery,
  LaboratoryGroupPaginationQuery,
} from './laboratory-group.dto'
import { LaboratoryGroup } from './laboratory-group.model'

export class LaboratoryGroupService {
  static loadedAll: boolean = false

  static laboratoryGroupAll: LaboratoryGroup[]
  static laboratoryGroupMap: Record<string, LaboratoryGroup> = {}

  static async getAll() {
    if (!LaboratoryGroupService.loadedAll) {
      const { data } = await LaboratoryGroupApi.list({ sort: { id: 'ASC' } })
      const laboratoryGroupList = data
      LaboratoryGroupService.laboratoryGroupAll = laboratoryGroupList

      LaboratoryGroupService.laboratoryGroupMap = arrayToKeyValue(laboratoryGroupList, 'id')
      LaboratoryGroupService.loadedAll = true
    }

    return LaboratoryGroup.fromList(LaboratoryGroupService.laboratoryGroupAll)
  }

  static async getMap() {
    await LaboratoryGroupService.getAll()
    return LaboratoryGroupService.laboratoryGroupMap
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

  static async list(options: LaboratoryGroupListQuery) {
    const filter = options.filter || {}
    const all = await LaboratoryGroupService.getAll()
    let data = all
    if (options.filter) {
      data = data.filter((i) => {
        return true
      })
    }
    return LaboratoryGroup.fromList(data)
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
