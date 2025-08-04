import { ref } from 'vue'
import { ESArray } from '../../utils'
import { ProductGroupApi } from './product-group.api'
import type { ProductGroupListQuery, ProductGroupPaginationQuery } from './product-group.dto'
import { ProductGroup } from './product-group.model'

export class ProductGroupService {
  static loadedAll: boolean = false

  static productGroupAll = ref<ProductGroup[]>([])
  static productGroupMap = ref<Record<string, ProductGroup>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const { data } = await ProductGroupApi.list({ sort: { id: 'ASC' } })
        const radiologyAll = data
        ProductGroupService.productGroupAll.value = radiologyAll
        ProductGroupService.productGroupMap.value = ESArray.arrayToKeyValue(radiologyAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ product-group.service.ts:21  ~ fetchAll ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !ProductGroupService.loadedAll || options.refetch) {
        ProductGroupService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  static async getAll(options?: { refetch: boolean }) {
    await ProductGroupService.fetchAll({ refetch: !!options?.refetch })
    return ProductGroupService.productGroupAll.value
  }

  static async getMap(options?: { refetch: boolean }) {
    await ProductGroupService.fetchAll({ refetch: !!options?.refetch })
    return ProductGroupService.productGroupMap.value
  }

  static async pagination(options: ProductGroupPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await ProductGroupService.getAll()
    const data = ProductGroupService.productGroupAll.value.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: ProductGroupService.productGroupAll.value.length },
    }
  }

  static async list(options: ProductGroupListQuery) {
    const filter = options.filter || {}
    const all = await ProductGroupService.getAll()
    let data = all
    if (options.filter) {
      data = data.filter((i) => {
        return true
      })
    }
    return ProductGroup.fromList(data)
  }

  static async replaceAll(body: ProductGroup[]) {
    const result = await ProductGroupApi.replaceAll(body)
    ProductGroupService.loadedAll = false
    return result
  }

  static async createOne(productGroup: ProductGroup) {
    const result = await ProductGroupApi.createOne(productGroup)
    ProductGroupService.loadedAll = false
    return result
  }

  static async updateOne(id: number, productGroup: ProductGroup) {
    const result = await ProductGroupApi.updateOne(id, productGroup)
    ProductGroupService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await ProductGroupApi.destroyOne(id)
    ProductGroupService.loadedAll = false
    return result
  }
}
