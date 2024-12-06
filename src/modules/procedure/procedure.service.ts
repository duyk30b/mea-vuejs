import { arrayToKeyValue, DString } from '../../utils'
import { ProcedureApi } from './procedure.api'
import type { ProcedureListQuery, ProcedurePaginationQuery } from './procedure.dto'
import { Procedure } from './procedure.model'

export class ProcedureService {
  static loadedAll: boolean = false
  static procedureAll: Procedure[]

  private static async getAll() {
    if (ProcedureService.loadedAll) return
    const { data } = await ProcedureApi.list({ sort: { id: 'ASC' } })
    ProcedureService.procedureAll = data
    ProcedureService.loadedAll = true
  }

  static async getMap() {
    await ProcedureService.getAll()
    return arrayToKeyValue(ProcedureService.procedureAll, 'id')
  }

  static async pagination(options: ProcedurePaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await ProcedureService.getAll()
    let data = ProcedureService.procedureAll
    if (options.filter) {
      const filter = options.filter || {}
      data = data.filter((i) => {
        if (filter.procedureGroupId != null) {
          if (filter.procedureGroupId !== i.procedureGroupId) {
            return false
          }
        }
        if (filter.isActive != null) {
          if (filter.isActive !== i.isActive) {
            return false
          }
        }
        if (filter.name) {
          if (filter.name.LIKE) {
            return DString.customFilter(i.name || '', filter.name.LIKE, 2)
          }
        }
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
      if (options.sort?.name) {
        data.sort((a, b) => {
          if (options.sort?.name === 'ASC') return a.name < b.name ? -1 : 1
          if (options.sort?.name === 'DESC') return a.name > b.name ? -1 : 1
          return a.name > b.name ? -1 : 1
        })
      }
      if (options.sort?.price) {
        data.sort((a, b) => {
          if (options.sort?.price === 'ASC') return a.price < b.price ? -1 : 1
          if (options.sort?.price === 'DESC') return a.price > b.price ? -1 : 1
          return a.price > b.price ? -1 : 1
        })
      }
    }
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: ProcedureService.procedureAll.length },
    }
  }

  static async list(options: ProcedureListQuery) {
    const filter = options.filter || {}
    await ProcedureService.getAll()
    let data = ProcedureService.procedureAll
    if (options.filter) {
      data = data.filter((i) => {
        if (filter.procedureGroupId != null) {
          if (filter.procedureGroupId !== i.procedureGroupId) {
            return false
          }
        }
        if (filter.isActive != null) {
          if (filter.isActive !== i.isActive) {
            return false
          }
        }
        if (filter.name) {
          if (filter.name.LIKE) {
            return DString.customFilter(i.name || '', filter.name.LIKE, 2)
          }
        }
        return true
      })
    }
    return Procedure.fromList(data)
  }

  static async createOne(procedure: Procedure) {
    const result = await ProcedureApi.createOne(procedure)
    ProcedureService.loadedAll = false
    return result
  }

  static async updateOne(id: number, procedure: Procedure) {
    const result = await ProcedureApi.updateOne(id, procedure)
    ProcedureService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await ProcedureApi.destroyOne(id)
    if (result.success) {
      ProcedureService.loadedAll = false
    }
    return result
  }
}
