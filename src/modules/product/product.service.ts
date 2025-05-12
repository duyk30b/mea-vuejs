import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { useMeStore } from '../_me/me.store'
import { AuthService } from '../auth/auth.service'
import { ProductApi } from './product.api'
import type { ProductDetailQuery, ProductListQuery, ProductPaginationQuery } from './product.dto'
import { Product } from './product.model'

export class ProductService {
  static async refreshDB() {
    try {
      let refreshTime = await RefreshTimeDB.findOneByCode('PRODUCT')
      if (!refreshTime) {
        refreshTime = { code: 'PRODUCT', dataVersion: 0, time: new Date(0).toISOString() }
      }
      const dataVersion = useMeStore().organization.dataVersionParse.product

      let apiResponse: { time: Date; data: Product[] }

      if (refreshTime.dataVersion !== dataVersion) {
        await ProductDB.truncate()
        apiResponse = await ProductApi.list({})
      } else {
        const lastTime = new Date(refreshTime.time)
        apiResponse = await ProductApi.list({
          filter: { updatedAt: { GTE: lastTime } },
        })
      }

      if (apiResponse.data.length) {
        await ProductDB.upsertMany(apiResponse.data)
        refreshTime.time = apiResponse.time.toISOString()
        refreshTime.dataVersion = dataVersion
        await RefreshTimeDB.upsertOne(refreshTime)
      }

      return { numberChange: apiResponse.data.length }
    } catch (error: any) {
      console.log('🚀 ~ file: product.service.ts:43 ~ ProductService ~ refreshDB ~ error:', error)
      AlertStore.add({ type: 'error', message: error.message })
      AuthService.logout()
      return
    }
  }

  static async pagination(params: ProductPaginationQuery) {
    const { page, limit, relation, filter, sort } = params
    const productPagination = await ProductDB.pagination({
      page: page || 1,
      limit: limit || 10,
      condition: {
        isActive: filter?.isActive,
        productGroupId: filter?.productGroupId,
        quantity: filter?.quantity,
        warehouseIds: filter?.warehouseIds,
        $OR: filter?.$OR,
      },
      sort: sort || { id: 'DESC' },
    })
    const productList = Product.fromList(productPagination.data)

    return {
      data: productList,
      meta: {
        page,
        limit,
        total: productPagination.total,
      },
    }
  }

  static async list(params: ProductListQuery) {
    const { filter, limit, sort, relation } = params
    const objects = await ProductDB.findMany({
      limit,
      condition: {
        id: filter?.id,
        isActive: filter?.isActive,
        productGroupId: filter?.productGroupId,
        quantity: filter?.quantity,
        warehouseIds: filter?.warehouseIds,
        $OR: filter?.$OR,
        $AND: filter?.$AND,
      },
      sort,
    })
    const productList = Product.fromList(objects)

    return productList
  }

  static async search(text: string) {
    if (!text) text = ''
    const objects = await ProductDB.findManyBy({
      $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }],
      isActive: 1,
    })
    return Product.fromList(objects)
  }

  static async getOne(id: number) {
    const product = await ProductDB.findOneByKey(id)
    return product
  }

  static async detail(id: number, query: ProductDetailQuery, options?: { refetch?: boolean }) {
    let product: Product | undefined
    if (options?.refetch) {
      product = await ProductApi.detail(id, query)
      await ProductDB.upsertOne(product)
    } else {
      product = await ProductDB.findOneByKey(id)
      if (!product) {
        product = Product.blank()
      }
    }
    return product
  }

  static async createOne(instance: Product) {
    const response = await ProductApi.createOne(instance)
    await ProductDB.upsertOne(response)
    return response
  }

  static async updateOne(id: number, instance: Product) {
    const response = await ProductApi.updateOne(id, instance)
    if (response.success) {
      await ProductDB.replaceOne(id, response.data.product)
    }
    return response
  }

  static async destroyOne(id: number) {
    const response = await ProductApi.destroyOne(id)
    if (response.success) {
      await ProductDB.deleteOneByKey(id)
    }
    return response
  }
}
