import { customFilter } from '../../utils'
import { LaboratoryApi } from './laboratory.api'
import type { LaboratoryPaginationQuery } from './laboratory.dto'
import type { Laboratory } from './laboratory.model'

export class LaboratoryService {
  static loadedAll: boolean = false
  static laboratoryAll: Laboratory[]

  static loadedExample: boolean = false
  static laboratoryExampleList: Laboratory[]

  static async getAll() {
    if (!LaboratoryService.loadedAll) {
      const fetchData = await LaboratoryApi.list({})
      LaboratoryService.laboratoryAll = fetchData.data
      LaboratoryService.loadedAll = true
    }

    return LaboratoryService.laboratoryAll
  }

  static async pagination(options: LaboratoryPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    const filter = options.filter || {}
    const all = await LaboratoryService.getAll()
    const data = all
      .filter((i) => {
        if (filter.laboratoryGroupId != null) {
          if (filter.laboratoryGroupId !== i.laboratoryGroupId) {
            return false
          }
        }
        if (filter.name) {
          if (filter.name.LIKE) {
            return customFilter(i.name || '', filter.name.LIKE, 2)
          }
        }
        return true
      })
      .slice((page - 1) * limit, page * limit)
    return { data, meta: { total: all.length } }
  }

  static async exampleList() {
    if (!LaboratoryService.loadedExample) {
      LaboratoryService.laboratoryExampleList = await LaboratoryApi.exampleList()
      LaboratoryService.loadedExample = true
    }

    return LaboratoryService.laboratoryExampleList
  }

  static async createOne(laboratory: Laboratory) {
    const result = await LaboratoryApi.createOne(laboratory)
    LaboratoryService.loadedAll = false
    return result
  }

  static async updateOne(id: number, laboratory: Laboratory) {
    const result = await LaboratoryApi.updateOne(id, laboratory)
    LaboratoryService.loadedAll = false
    return result
  }

  static async deleteOne(id: number) {
    const result = await LaboratoryApi.deleteOne(id)
    LaboratoryService.loadedAll = false
    return result
  }
}
