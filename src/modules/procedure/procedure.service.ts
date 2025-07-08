import { ref } from 'vue'
import { arrayToKeyValue, DString, ESArray } from '../../utils'
import { Position, PositionService } from '../position'
import { ProcedureApi } from './procedure.api'
import type {
  ProcedureDetailQuery,
  ProcedureGetQuery,
  ProcedureListQuery,
  ProcedurePaginationQuery,
} from './procedure.dto'
import { Procedure } from './procedure.model'
import { Discount, DiscountService } from '../discount'

export class ProcedureService {
  static loadedAll: boolean = false
  static procedureAll: Procedure[] = []
  static procedureMap = ref<Record<string, Procedure>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        const procedureAll = await ProcedureApi.list({})
        ProcedureService.procedureAll = procedureAll
        ProcedureService.procedureMap.value = ESArray.arrayToKeyValue(procedureAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ file: procedure.service.ts:26 ~ ProcedureService ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !ProcedureService.loadedAll || options.refetch) {
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

  static async getMap(options?: { refetch: boolean }) {
    await ProcedureService.fetchAll({ refetch: !!options?.refetch })
    return ProcedureService.procedureMap.value
  }

  static async pagination(query: ProcedurePaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await ProcedureService.fetchAll({ refetch: !!options?.refetch })

    let data = ProcedureService.executeQuery(ProcedureService.procedureAll, query)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data: Procedure.fromList(data),
      meta: { total: ProcedureService.procedureAll.length },
    }
  }

  static async list(query: ProcedureListQuery, options?: { refetch: boolean }) {
    await ProcedureService.fetchAll({ refetch: !!options?.refetch })
    const data = ProcedureService.executeQuery(ProcedureService.procedureAll, query)

    return Procedure.fromList(data)
  }

  static async detail(
    id: number,
    query: ProcedureDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let procedure: Procedure | undefined
    if (options?.query) {
      procedure = await ProcedureApi.detail(id, query)
      const findIndex = ProcedureService.procedureAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) ProcedureService.procedureAll[findIndex] = procedure
    } else {
      await ProcedureService.fetchAll({ refetch: !!options?.refetch })
      procedure = ProcedureService.procedureAll.find((i) => i.id === id)
    }

    return procedure ? Procedure.from(procedure) : Procedure.blank()
  }

  static async createOne(body: {
    procedure: Procedure
    positionList?: Position[]
    discountList?: Discount[]
  }) {
    const procedure = await ProcedureApi.createOne(body)
    return procedure
  }

  static async updateOne(
    id: number,
    body: {
      procedure: Procedure
      positionList?: Position[]
      discountList?: Discount[]
    },
  ) {
    const procedure = await ProcedureApi.updateOne(id, body)
    return procedure
  }

  static async destroyOne(id: number) {
    const result = await ProcedureApi.destroyOne(id)
    return result
  }
}
