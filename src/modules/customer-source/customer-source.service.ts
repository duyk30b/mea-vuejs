import { CustomerSourceApi } from './customer-source.api'
import type { CustomerSourceListQuery } from './customer-source.dto'
import { CustomerSource } from './customer-source.model'

export class CustomerSourceService {
  static loadedAll: boolean = false
  static customerSourceAll: CustomerSource[]

  private static async getAll() {
    try {
      if (!CustomerSourceService.loadedAll) {
        const { data } = await CustomerSourceApi.list({})
        const productGroupList = data
        CustomerSourceService.customerSourceAll = productGroupList
        CustomerSourceService.loadedAll = true
      }
      return CustomerSourceService.customerSourceAll
    } catch (error) {
      console.log('🚀 ~ file: customer-source.service.ts:20 ~ getAll ~ error:', error)
      return []
    }
  }

  static async list(options: CustomerSourceListQuery) {
    const filter = options.filter || {}
    const all = await CustomerSourceService.getAll()
    let data = all
    if (options.filter) {
      data = data.filter((i) => {
        return true
      })
    }
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
