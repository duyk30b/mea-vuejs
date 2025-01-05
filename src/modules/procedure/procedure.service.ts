import { arrayToKeyValue, DString } from '../../utils'
import { CommissionService } from '../commission'
import { ProcedureApi } from './procedure.api'
import type {
  ProcedureDetailQuery,
  ProcedureGetQuery,
  ProcedureListQuery,
  ProcedurePaginationQuery,
} from './procedure.dto'
import { Procedure } from './procedure.model'

export class ProcedureService {
  static loadedAll: boolean = false
  static procedureAll: Procedure[] = []

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        ProcedureService.procedureAll = await ProcedureApi.list({})
      } catch (error: any) {
        console.log('🚀 ~ file: procedure.service.ts:20 ~ ProcedureService ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetchPromise || !ProcedureService.loadedAll || options.refresh) {
        ProcedureService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: Procedure[], query: ProcedureGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
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
    if (query.sort) {
      const sort = query.sort
      if (sort?.id) {
        data.sort((a, b) => {
          if (sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
      if (sort?.name) {
        data.sort((a, b) => {
          if (sort?.name === 'ASC') return a.name < b.name ? -1 : 1
          if (sort?.name === 'DESC') return a.name > b.name ? -1 : 1
          return a.name > b.name ? -1 : 1
        })
      }
      if (sort?.price) {
        data.sort((a, b) => {
          if (sort?.price === 'ASC') return a.price < b.price ? -1 : 1
          if (sort?.price === 'DESC') return a.price > b.price ? -1 : 1
          return a.price > b.price ? -1 : 1
        })
      }
    }
    return data
  }

  static async getMap() {
    await ProcedureService.fetchAll()
    const procedureMap = arrayToKeyValue(ProcedureService.procedureAll, 'id')
    return procedureMap
  }

  static async pagination(query: ProcedurePaginationQuery, options?: { refresh: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await ProcedureService.fetchAll({ refresh: !!options?.refresh })

    let data = ProcedureService.executeQuery(ProcedureService.procedureAll, query)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data: Procedure.fromList(data),
      meta: { total: ProcedureService.procedureAll.length },
    }
  }

  static async list(query: ProcedureListQuery, options?: { refresh: boolean }) {
    await ProcedureService.fetchAll({ refresh: !!options?.refresh })
    const data = ProcedureService.executeQuery(ProcedureService.procedureAll, query)

    return Procedure.fromList(data)
  }

  static async detail(id: number, options: ProcedureDetailQuery = {}) {
    const procedure = await ProcedureApi.detail(id, options)
    if (procedure && procedure.commissionList) {
      const findIndex = ProcedureService.procedureAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        ProcedureService.procedureAll[findIndex] = procedure
      }
    }
    return procedure
  }

  static async createOne(procedure: Procedure) {
    const result = await ProcedureApi.createOne(procedure)
    CommissionService.loadedAll = false
    ProcedureService.loadedAll = false
    return result
  }

  static async updateOne(id: number, procedure: Procedure) {
    const result = await ProcedureApi.updateOne(id, procedure)
    CommissionService.loadedAll = false
    ProcedureService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await ProcedureApi.destroyOne(id)
    if (result.success) {
      ProcedureService.loadedAll = false
      CommissionService.loadedAll = false
    }
    return result
  }
}
