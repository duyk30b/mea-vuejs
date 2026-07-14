import { arrayToKeyValue } from '../../utils'
import { CustomerSourceApi } from './customer_source.api'
import type {
  CustomerSourceGetQuery,
  CustomerSourceListQuery,
  CustomerSourcePaginationQuery,
} from './customer_source.dto'
import { CustomerSource } from './customer_source.model'

export class CustomerSourceService {
  static loadedAll: boolean = false
  static customerSourceAll: CustomerSource[]

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng refresh: true
  static fetchAll = (() => {
    const start = async () => {
      try {
        CustomerSourceService.customerSourceAll = await CustomerSourceApi.list({})
      } catch (error: any) {
        console.log('🚀 ~ file: customer-source.service.ts:15 ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !CustomerSourceService.loadedAll || options.refetch) {
        CustomerSourceService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  static async getAll(options?: { refetch: boolean }) {
    await CustomerSourceService.fetchAll({ refetch: !!options?.refetch })
    return CustomerSourceService.customerSourceAll
  }

  static async getMap(options?: { refetch: boolean }) {
    await CustomerSourceService.fetchAll({ refetch: !!options?.refetch })
    return arrayToKeyValue(CustomerSourceService.customerSourceAll, 'id')
  }

  private static executeQuery(all: CustomerSource[], query: CustomerSourceGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return true
      })
    }
    if (query.sort) {
      if (query.sort?.id) {
        data.sort((a, b) => {
          if (query.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (query.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    return data
  }

  static async pagination(options: CustomerSourcePaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await CustomerSourceService.getAll()
    const dataQuery = CustomerSourceService.executeQuery(
      CustomerSourceService.customerSourceAll,
      options,
    )
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: CustomerSourceListQuery, options?: { refetch: boolean }) {
    await CustomerSourceService.getAll({ refetch: !!options?.refetch })
    const data = CustomerSourceService.executeQuery(
      CustomerSourceService.customerSourceAll,
      query,
    )
    return CustomerSource.fromList(data)
  }

  static async createOne(customerSource: CustomerSource) {
    const result = await CustomerSourceApi.createOne(customerSource)
    CustomerSourceService.loadedAll = false
    return result
  }

  static async updateOne(id: number, customerSource: CustomerSource) {
    const result = await CustomerSourceApi.updateOne(id, customerSource)
    CustomerSourceService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await CustomerSourceApi.destroyOne(id)
    CustomerSourceService.loadedAll = false
    return result
  }
}
