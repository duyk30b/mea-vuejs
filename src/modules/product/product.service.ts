import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { IndexedDBQuery } from '../../core/indexed-db/_base/indexed-db.query'
import { BatchDB } from '../../core/indexed-db/repository/batch.repository'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { ESArray } from '../../utils'
import { useMeStore } from '../_me/me.store'
import { AuthService } from '../auth/auth.service'
import { CommissionService } from '../commission'
import { ProductApi } from './product.api'
import type {
  ProductDetailQuery,
  ProductGetQuery,
  ProductListQuery,
  ProductPaginationQuery,
} from './product.dto'
import { Product } from './product.model'

const ProductDBQuery = new IndexedDBQuery<Product>()

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

  private static async executeQuery(all: Product[], query: ProductGetQuery) {
    let data = all

    if (query.relation) {
      if (query.relation.batchList) {
        const batchAll = await BatchDB.findManyBy({ quantity: { NOT: 0 } })
        const batchMap = ESArray.arrayToKeyArray(batchAll, 'productId')
        data.forEach((i) => (i.batchList = batchMap[i.id]))
      }
    }
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return ProductDBQuery.executeFilter(i, filter)
      })
    }

    if (query.sort) {
      data = ProductDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async pagination(query: ProductPaginationQuery) {
    const page = query.page || 1
    const limit = query.limit || 10
    const productAll = await ProductDB.findAll()

    const dataTotal = await ProductService.executeQuery(productAll, query)
    const data = dataTotal.slice((page - 1) * limit, page * limit)

    const productList = Product.fromList(data)
    productList.forEach((product) => {
      product.batchList?.forEach((batch) => {
        batch.product = Product.basic(product)
      })
    })

    return {
      page,
      limit,
      total: dataTotal.length,
      productList,
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
      $OR: [
        { productCode: { LIKE: text } },
        { brandName: { LIKE: text } },
        { substance: { LIKE: text } },
      ],
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
    CommissionService.loadedAll = false
    return response
  }

  static async updateOne(id: number, instance: Product) {
    const response = await ProductApi.updateOne(id, instance)
    if (response.success) {
      await ProductDB.replaceOne(id, response.data.product)
      CommissionService.loadedAll = false
    }
    return response
  }

  static async destroyOne(id: number) {
    const response = await ProductApi.destroyOne(id)
    if (response.success) {
      await ProductDB.deleteOneByKey(id)
      CommissionService.loadedAll = false
    }
    return response
  }
}
