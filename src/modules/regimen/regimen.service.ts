import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { Discount, DiscountInteractType, DiscountService } from '../discount'
import { Position } from '../position'
import { RegimenApi } from './regimen.api'
import type {
  RegimenDetailQuery,
  RegimenGetQuery,
  RegimenListQuery,
  RegimenPaginationQuery,
} from './regimen.dto'
import { Regimen } from './regimen.model'
import type { RegimenItem } from './regimen-item.model'
import { ProcedureService } from '../procedure'

const RegimenDBQuery = new IndexedDBQuery<Regimen>()

export class RegimenService {
  static loadedAll: boolean = false
  static regimenAll = ref<Regimen[]>([])
  static regimenMap = ref<Record<string, Regimen>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        const regimenAll = await RegimenApi.list({
          relation: { regimenItemList: { procedure: false } },
        })
        RegimenService.regimenAll.value = regimenAll
        RegimenService.regimenMap.value = ESArray.arrayToKeyValue(regimenAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ file: regimen.service.ts:26 ~ RegimenService ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !RegimenService.loadedAll || options.refetch) {
        RegimenService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: Regimen[], query: RegimenGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return RegimenDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = RegimenDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(regimenList: Regimen[], relation: RegimenGetQuery['relation']) {
    try {
      const regimenIdList = regimenList.map((i) => i.id)

      const [procedureMap, discountAll] = await Promise.all([
        ProcedureService.getMap(),
        DiscountService.getAll(),
      ])

      regimenList.forEach((regimen) => {
        if (relation?.discountList) {
          regimen.discountList = discountAll.filter((i) => {
            if (!(i.discountInteractType === DiscountInteractType.Regimen)) return false
            if (![0, regimen.id].includes(i.discountInteractId)) return false
            return true
          })
        }
        if (relation?.regimenItemList?.procedure) {
          regimen.regimenItemList?.forEach((i) => {
            i.procedure = procedureMap[i.procedureId]
          })
        }
      })
    } catch (error) {
      console.log('🚀 ~ regimen.service.ts:78 ~ RegimenService ~ error:', error)
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await RegimenService.fetchAll({ refetch: !!options?.refetch })
    return RegimenService.regimenMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await RegimenService.fetchAll({ refetch: !!options?.refetch })
    return RegimenService.regimenAll.value
  }

  static async pagination(query: RegimenPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await RegimenService.fetchAll({ refetch: !!options?.refetch })

    const dataQuery = RegimenService.executeQuery(RegimenService.regimenAll.value, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)

    if (query.relation) {
      await RegimenService.executeRelation(data, query.relation)
    }

    return {
      data: Regimen.fromList(data),
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: RegimenListQuery, options?: { refetch: boolean }) {
    await RegimenService.fetchAll({ refetch: !!options?.refetch })
    const data = RegimenService.executeQuery(RegimenService.regimenAll.value, query)

    if (query.relation) {
      await RegimenService.executeRelation(data, query.relation)
    }

    return Regimen.fromList(data)
  }

  static async detail(
    id: number,
    query: RegimenDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let regimen: Regimen | undefined
    if (options?.query) {
      regimen = await RegimenApi.detail(id, query)
      Object.assign(RegimenService.regimenMap.value[id], regimen)
    } else {
      await RegimenService.fetchAll({ refetch: !!options?.refetch })
      regimen = RegimenService.regimenMap.value[id]
    }
    return regimen ? Regimen.from(regimen) : Regimen.blank()
  }

  static async createOne(body: {
    regimen: Regimen
    regimenItemList: RegimenItem[]
    positionRequestList?: Position[]
    positionResultList?: Position[]
    discountList?: Discount[]
  }) {
    const regimen = await RegimenApi.createOne(body)
    RegimenService.loadedAll = false
    return regimen
  }

  static async updateOne(
    id: number,
    body: {
      regimen: Regimen
      regimenItemList: RegimenItem[]
      positionRequestList?: Position[]
      positionResultList?: Position[]
      discountList?: Discount[]
    },
  ) {
    const regimen = await RegimenApi.updateOne(id, body)
    RegimenService.loadedAll = false
    return regimen
  }

  static async destroyOne(id: number) {
    const result = await RegimenApi.destroyOne(id)
    RegimenService.loadedAll = false
    return result
  }
}
