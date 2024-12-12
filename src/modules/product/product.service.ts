import { BatchDB } from '../../core/indexed-db/repository/batch.repository'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { arrayToKeyArray } from '../../utils'
import { useMeStore } from '../_me/me.store'
import { Batch } from '../batch'
import { ProductApi } from './product.api'
import type { ProductDetailQuery, ProductListQuery, ProductPaginationQuery } from './product.dto'
import { Product } from './product.model'

export class ProductService {
  static async refreshDB() {
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

    if (relation?.batchList) {
      const productIdList = productList.map((i) => i.id)
      if (productIdList.length) {
        const batchList = await BatchDB.findMany({
          condition: { productId: { IN: productIdList }, quantity: { NOT: 0 } },
        })
        const batchListMapProductId = arrayToKeyArray(batchList, 'productId')
        productList.forEach((i) => {
          batchListMapProductId[i.id] ||= []
          i.batchList = Batch.fromList(batchListMapProductId[i.id])
          i.batchList.forEach((j) => (j.product = i))
        })
      }
    }

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
      },
      sort,
    })
    const productList = Product.fromList(objects)
    if (relation?.batchList && productList.length) {
      const productIdList = productList.map((i) => i.id)
      const batchList = await BatchDB.findMany({
        condition: {
          productId: { IN: productIdList },
          quantity: filter?.batchList?.quantity,
          warehouseId: filter?.batchList?.warehouseId,
        },
      })
      const batchListMapProductId = arrayToKeyArray(batchList, 'productId')
      productList.forEach((i) => {
        batchListMapProductId[i.id] ||= []
        i.batchList = Batch.fromList(batchListMapProductId[i.id])
        i.batchList.forEach((j) => (j.product = i))
      })
    }
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

  static async getOne(id: number, options: ProductDetailQuery) {
    const product = await ProductApi.detail(id, options)
    // const product = await ProductDB.findOneByKey(id)
    if (product) {
      await ProductDB.upsertOne(product)
    }
    if (product.batchList?.length) {
      await BatchDB.upsertMany(product.batchList)
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
