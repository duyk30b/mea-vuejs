import { ESArray } from '@/utils'
import { ref } from 'vue'
import { CustomerGroupApi } from './customer_group.api'
import type { CustomerGroupListQuery, CustomerGroupPaginationQuery } from './customer_group.dto'
import { CustomerGroup } from './customer_group.model'

export class CustomerGroupService {
  static loadedAll: boolean = false

  static customerGroupAll = ref<CustomerGroup[]>([])
  static customerGroupMap = ref<Record<string, CustomerGroup>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const customerGroupAll = await CustomerGroupApi.list({ sort: { id: 'ASC' } })
        CustomerGroupService.customerGroupAll.value = customerGroupAll
        CustomerGroupService.customerGroupMap.value = ESArray.arrayToKeyValue(
          customerGroupAll,
          'id',
        )
      } catch (error: any) {
        console.log('🚀 ~ customer_group.service.ts:21  ~ fetchAll ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !CustomerGroupService.loadedAll || options.refetch) {
        CustomerGroupService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  static async getAll(options?: { refetch: boolean }) {
    await CustomerGroupService.fetchAll({ refetch: !!options?.refetch })
    return CustomerGroupService.customerGroupAll.value
  }

  static async getMap(options?: { refetch: boolean }) {
    await CustomerGroupService.fetchAll({ refetch: !!options?.refetch })
    return CustomerGroupService.customerGroupMap.value
  }

  static async pagination(options: CustomerGroupPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await CustomerGroupService.getAll()
    const data = CustomerGroupService.customerGroupAll.value.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: CustomerGroupService.customerGroupAll.value.length },
    }
  }

  static async list(query: CustomerGroupListQuery, options?: { refetch: boolean }) {
    const filter = query.filter || {}
    const all = await CustomerGroupService.getAll({ refetch: !!options?.refetch })
    let data = all
    if (query.filter) {
      data = data.filter((i) => {
        return true
      })
    }
    return CustomerGroup.fromList(data)
  }

  static async replaceAll(body: CustomerGroup[]) {
    const result = await CustomerGroupApi.replaceAll(body)
    CustomerGroupService.loadedAll = false
    return result
  }
}
