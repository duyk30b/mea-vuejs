import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { Discount, DiscountInteractType, DiscountService } from '../discount'
import { Position } from '../position'
import { ProcedureApi } from './procedure.api'
import type {
  ProcedureDetailQuery,
  ProcedureGetQuery,
  ProcedureListQuery,
  ProcedurePaginationQuery,
} from './procedure.dto'
import { Procedure } from './procedure.model'

const ProcedureDBQuery = new IndexedDBQuery<Procedure>()

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
        return ProcedureDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = ProcedureDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(
    procedureList: Procedure[],
    relation: ProcedureGetQuery['relation'],
  ) {
    try {
      const procedureIdList = procedureList.map((i) => i.id)

      await Promise.all([DiscountService.getMap()])

      const discountAll = DiscountService.discountAll

      procedureList.forEach((procedure) => {
        if (relation?.discountList) {
          procedure.discountList = discountAll.filter((i) => {
            if (!(i.discountInteractType === DiscountInteractType.Procedure)) return false
            if (![0, procedure.id].includes(i.discountInteractId)) return false
            return true
          })
        }
      })
    } catch (error) {
      console.log('🚀 ~ procedure.service.ts:78 ~ ProcedureService ~ error:', error)
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await ProcedureService.fetchAll({ refetch: !!options?.refetch })
    return ProcedureService.procedureMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await ProcedureService.fetchAll({ refetch: !!options?.refetch })
    return ProcedureService.procedureAll
  }

  static async pagination(query: ProcedurePaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await ProcedureService.fetchAll({ refetch: !!options?.refetch })

    const dataQuery = ProcedureService.executeQuery(ProcedureService.procedureAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)

    if (query.relation) {
      await ProcedureService.executeRelation(data, query.relation)
    }

    return {
      data: Procedure.fromList(data),
      meta: { total: dataQuery.length },
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
      ProcedureService.procedureMap.value[procedure.id] = procedure
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
