import { ESString } from '../../utils'
import { PaymentMethodApi } from './payment-method.api'
import type {
    PaymentMethodDetailQuery,
    PaymentMethodListQuery,
    PaymentMethodPaginationQuery,
} from './payment-method.dto'
import { PaymentMethod } from './payment-method.model'

export class PaymentMethodService {
  static loadedAll: boolean = false

  static paymentMethodAll: PaymentMethod[] = []

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await PaymentMethodApi.list({
          sort: { id: 'ASC' },
        })
        PaymentMethodService.paymentMethodAll = data
      } catch (error: any) {
        console.log('🚀 ~ payment-method.service.ts:21 ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetchPromise || !PaymentMethodService.loadedAll || options.refresh) {
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
        return true
      })
    }
    if (query.sort) {
      if (query.sort.id) {
        data.sort((a, b) => {
          if (query.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (query.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
      if (query.sort.priority) {
        data.sort((a, b) => {
          if (query.sort?.priority === 'ASC') return a.priority < b.priority ? -1 : 1
          if (query.sort?.priority === 'DESC') return a.priority > b.priority ? -1 : 1
          return a.priority > b.priority ? -1 : 1
        })
      }
    }
    return data
  }

  static async pagination(query: PaymentMethodPaginationQuery) {
    const page = query.page || 1
    const limit = query.limit || 10
    await PaymentMethodService.fetchAll()
    const dataQuery = PaymentMethodService.executeQuery(PaymentMethodService.paymentMethodAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: dataQuery.length },
    }
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

  static async createOne(paymentMethod: PaymentMethod, options?: { clearCache?: boolean }) {
    const result = await PaymentMethodApi.createOne(paymentMethod)
    if (options?.clearCache) {
      PaymentMethodService.loadedAll = false
    } else {
      const ins = PaymentMethod.from(result)
      PaymentMethodService.paymentMethodAll.push(ins)
    }
    return result
  }

  static async updateOne(
    id: number,
    paymentMethod: Partial<PaymentMethod>,
    options?: { clearCache?: boolean },
  ) {
    const result = await PaymentMethodApi.updateOne(id, paymentMethod)
    if (options?.clearCache) {
      PaymentMethodService.loadedAll = false
    } else {
      const ins = PaymentMethod.from(result)
      const findIndex = PaymentMethodService.paymentMethodAll.findIndex((i) => i.id === ins.id)
      if (findIndex !== -1) {
        PaymentMethodService.paymentMethodAll[findIndex] = ins
      } else {
        PaymentMethodService.paymentMethodAll.push(ins)
      }
    }
    return result
  }

  static async destroyOne(id: number, options?: { clearCache?: boolean }) {
    const result = await PaymentMethodApi.destroyOne(id)
    if (options?.clearCache) {
      PaymentMethodService.loadedAll = false
    } else {
      const findIndex = PaymentMethodService.paymentMethodAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        PaymentMethodService.paymentMethodAll.splice(findIndex, 1)
      }
    }
    return result
  }

  static async search(text: string) {
    if (!text) text = ''
    return PaymentMethodService.paymentMethodAll.filter((i) => {
      return ESString.customFilter(i.name, text)
    })
  }
}
