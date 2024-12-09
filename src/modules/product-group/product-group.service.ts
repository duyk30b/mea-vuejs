import { arrayToKeyValue } from '../../utils'
import { ProductGroupApi } from './product-group.api'
import type { ProductGroupListQuery, ProductGroupPaginationQuery } from './product-group.dto'
import { ProductGroup } from './product-group.model'

export class ProductGroupService {
  static loadedAll: boolean = false

  static productGroupAll: ProductGroup[] = []
  static productGroupMap: Record<string, ProductGroup> = {}

  private static async getAll() {
    if (!ProductGroupService.loadedAll) {
      const { data } = await ProductGroupApi.list({ sort: { id: 'ASC' } })
      const productGroupList = data
      ProductGroupService.productGroupAll = productGroupList

      ProductGroupService.productGroupMap = arrayToKeyValue(productGroupList, 'id')
      ProductGroupService.loadedAll = true
    }

    return ProductGroupService.productGroupAll
  }

  static async getMap() {
    await ProductGroupService.getAll()
    return ProductGroupService.productGroupMap
  }

  static async pagination(options: ProductGroupPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await ProductGroupService.getAll()
    const data = ProductGroupService.productGroupAll.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: ProductGroupService.productGroupAll.length },
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
