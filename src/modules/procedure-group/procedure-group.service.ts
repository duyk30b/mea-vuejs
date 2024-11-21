import { arrayToKeyValue } from '../../utils'
import { ProcedureGroupApi } from './procedure-group.api'
import type { ProcedureGroupListQuery, ProcedureGroupPaginationQuery } from './procedure-group.dto'
import { ProcedureGroup } from './procedure-group.model'

export class ProcedureGroupService {
  static loadedAll: boolean = false

  static procedureGroupAll: ProcedureGroup[]
  static procedureGroupMap: Record<string, ProcedureGroup> = {}

  private static async getAll() {
    if (!ProcedureGroupService.loadedAll) {
      const { data } = await ProcedureGroupApi.list({ sort: { id: 'ASC' } })
      const procedureGroupList = data
      ProcedureGroupService.procedureGroupAll = procedureGroupList

      ProcedureGroupService.procedureGroupMap = arrayToKeyValue(procedureGroupList, 'id')
      ProcedureGroupService.loadedAll = true
    }

    return ProcedureGroupService.procedureGroupAll
  }

  static async getMap() {
    await ProcedureGroupService.getAll()
    return ProcedureGroupService.procedureGroupMap
  }

  static async pagination(options: ProcedureGroupPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await ProcedureGroupService.getAll()
    const data = ProcedureGroupService.procedureGroupAll.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: ProcedureGroupService.procedureGroupAll.length },
    }
  }

  static async list(options: ProcedureGroupListQuery) {
    const filter = options.filter || {}
    const all = await ProcedureGroupService.getAll()
    let data = all
    if (options.filter) {
      data = data.filter((i) => {
        return true
      })
    }
    return ProcedureGroup.fromList(data)
  }

  static async replaceAll(body: ProcedureGroup[]) {
    const result = await ProcedureGroupApi.replaceAll(body)
    ProcedureGroupService.loadedAll = false
    return result
  }

  static async createOne(procedureGroup: ProcedureGroup) {
    const result = await ProcedureGroupApi.createOne(procedureGroup)
    ProcedureGroupService.loadedAll = false
    return result
  }

  static async updateOne(id: number, procedureGroup: ProcedureGroup) {
    const result = await ProcedureGroupApi.updateOne(id, procedureGroup)
    ProcedureGroupService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await ProcedureGroupApi.destroyOne(id)
    ProcedureGroupService.loadedAll = false
    return result
  }
}
