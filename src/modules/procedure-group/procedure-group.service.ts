import { arrayToKeyValue } from '../../utils'
import { ProcedureGroupApi } from './procedure-group.api'
import type { ProcedureGroupListQuery, ProcedureGroupPaginationQuery } from './procedure-group.dto'
import { ProcedureGroup } from './procedure-group.model'

export class ProcedureGroupService {
  static loadedAll: boolean = false

  static procedureGroupAll: ProcedureGroup[] = []
  static procedureGroupMap: Record<string, ProcedureGroup> = {}

  private static async getAll() {
    if (ProcedureGroupService.loadedAll) return
    const { data } = await ProcedureGroupApi.list({ sort: { id: 'ASC' } })
    ProcedureGroupService.procedureGroupAll = data
    ProcedureGroupService.loadedAll = true
  }

  static async getMap() {
    await ProcedureGroupService.getAll()
    return arrayToKeyValue(ProcedureGroupService.procedureGroupAll, 'id')
  }

  static async pagination(options: ProcedureGroupPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await ProcedureGroupService.getAll()
    let data = ProcedureGroupService.procedureGroupAll
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
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: ProcedureGroupService.procedureGroupAll.length },
    }
  }

  static async list(options: ProcedureGroupListQuery) {
    const filter = options.filter || {}
    await ProcedureGroupService.getAll()
    let data = ProcedureGroupService.procedureGroupAll
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
