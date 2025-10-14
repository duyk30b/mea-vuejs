import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray, ESString } from '../../utils'
import { SurchargeApi } from './surcharge.api'
import type {
  SurchargeDetailQuery,
  SurchargeListQuery,
  SurchargePaginationQuery,
} from './surcharge.dto'
import { Surcharge } from './surcharge.model'

const SurchargeDBQuery = new IndexedDBQuery<Surcharge>()

export class SurchargeService {
  static loadedAll: boolean = false

  static surchargeAll = ref<Surcharge[]>([])
  static surchargeMap = ref<Record<string, Surcharge>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const surchargeAll = await SurchargeApi.list({ sort: { id: 'ASC' } })
        SurchargeService.surchargeAll.value = surchargeAll
        SurchargeService.surchargeMap.value = ESArray.arrayToKeyValue(surchargeAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ payment-method.service.ts:21 ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !SurchargeService.loadedAll || options.refetch) {
        SurchargeService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: Surcharge[], query: SurchargePaginationQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return SurchargeDBQuery.executeFilter(i, filter)
      })
    }
    if (query.sort) {
      data = SurchargeDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async pagination(query: SurchargePaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await SurchargeService.fetchAll({ refetch: !!options?.refetch })
    const dataQuery = SurchargeService.executeQuery(SurchargeService.surchargeAll.value, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      surchargeList: data,
      total: dataQuery.length,
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await SurchargeService.fetchAll({ refetch: !!options?.refetch })
    return SurchargeService.surchargeMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await SurchargeService.fetchAll({ refetch: !!options?.refetch })
    return SurchargeService.surchargeAll.value
  }

  static async list(query: SurchargeListQuery, options?: { refetch: boolean }) {
    await SurchargeService.fetchAll({ refetch: !!options?.refetch })
    const data = SurchargeService.executeQuery(SurchargeService.surchargeAll.value, query)

    return Surcharge.fromList(data)
  }

  static async detail(id: number, options?: { refetch: boolean }) {
    const surchargeMap = await SurchargeService.getMap({ refetch: !!options?.refetch })
    const surcharge = surchargeMap[id]
    return Surcharge.from(surcharge)
  }

  static async createOne(surcharge: Surcharge, options?: {}) {
    const result = await SurchargeApi.createOne(surcharge)
    SurchargeService.loadedAll = false
    return result
  }

  static async updateOne(id: number, surcharge: Partial<Surcharge>, options?: {}) {
    const result = await SurchargeApi.updateOne(id, surcharge)
    SurchargeService.loadedAll = false
    return result
  }

  static async destroyOne(id: number, options?: {}) {
    const result = await SurchargeApi.destroyOne(id)
    SurchargeService.loadedAll = false
    return result
  }

  static async search(text: string) {
    if (!text) text = ''
    return SurchargeService.surchargeAll.value.filter((i) => {
      return ESString.customFilter(i.name, text)
    })
  }
}
