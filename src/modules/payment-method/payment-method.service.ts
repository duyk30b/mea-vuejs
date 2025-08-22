import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray, ESString } from '../../utils'
import { PaymentMethodApi } from './payment-method.api'
import type {
  PaymentMethodDetailQuery,
  PaymentMethodListQuery,
  PaymentMethodPaginationQuery,
} from './payment-method.dto'
import { PaymentMethod } from './payment-method.model'

const PaymentMethodDBQuery = new IndexedDBQuery<PaymentMethod>()

export class PaymentMethodService {
  static loadedAll: boolean = false

  static paymentMethodAll: PaymentMethod[] = []
  static paymentMethodMap = ref<Record<string, PaymentMethod>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const paymentMethodAll = await PaymentMethodApi.list({ sort: { id: 'ASC' } })
        PaymentMethodService.paymentMethodAll = paymentMethodAll
        PaymentMethodService.paymentMethodMap.value = ESArray.arrayToKeyValue(
          paymentMethodAll,
          'id',
        )
      } catch (error: any) {
        console.log('🚀 ~ payment-method.service.ts:21 ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !PaymentMethodService.loadedAll || options.refetch) {
        PaymentMethodService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: PaymentMethod[], query: PaymentMethodPaginationQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return PaymentMethodDBQuery.executeFilter(i, filter)
      })
    }
    if (query.sort) {
      data = PaymentMethodDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async pagination(query: PaymentMethodPaginationQuery) {
    const page = query.page || 1
    const limit = query.limit || 10
    await PaymentMethodService.fetchAll()
    const dataQuery = PaymentMethodService.executeQuery(
      PaymentMethodService.paymentMethodAll,
      query,
    )
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      paymentMethodList: data,
      total: dataQuery.length,
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await PaymentMethodService.fetchAll({ refetch: !!options?.refetch })
    return PaymentMethodService.paymentMethodMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await PaymentMethodService.fetchAll({ refetch: !!options?.refetch })
    return PaymentMethodService.paymentMethodAll
  }

  static async list(query: PaymentMethodListQuery) {
    await PaymentMethodService.fetchAll()
    const data = PaymentMethodService.executeQuery(PaymentMethodService.paymentMethodAll, query)

    return PaymentMethod.fromList(data)
  }

  static async detail(id: number, options: PaymentMethodDetailQuery = {}) {
    const paymentMethod = await PaymentMethodApi.detail(id, options)
    if (paymentMethod) {
      const findIndex = PaymentMethodService.paymentMethodAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        PaymentMethodService.paymentMethodAll[findIndex] = paymentMethod
      }
    }
    return paymentMethod
  }

  static async createOne(paymentMethod: PaymentMethod, options?: {}) {
    const result = await PaymentMethodApi.createOne(paymentMethod)
    PaymentMethodService.loadedAll = false
    return result
  }

  static async updateOne(id: number, paymentMethod: Partial<PaymentMethod>, options?: {}) {
    const result = await PaymentMethodApi.updateOne(id, paymentMethod)
    PaymentMethodService.loadedAll = false
    return result
  }

  static async destroyOne(id: number, options?: {}) {
    const result = await PaymentMethodApi.destroyOne(id)
    PaymentMethodService.loadedAll = false
    return result
  }

  static async search(text: string) {
    if (!text) text = ''
    return PaymentMethodService.paymentMethodAll.filter((i) => {
      return ESString.customFilter(i.name, text)
    })
  }
}
