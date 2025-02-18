import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { BatchDB } from '../../core/indexed-db/repository/batch.repository'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { arrayToKeyValue } from '../../utils'
import { useMeStore } from '../_me/me.store'
import { AuthService } from '../auth/auth.service'
import { Product } from '../product'
import { BatchApi } from './batch.api'
import type { BatchListQuery, BatchPaginationQuery } from './batch.dto'
import { Batch } from './batch.model'

export class BatchService {
  static async refreshDB() {
    try {
      let refreshTime = await RefreshTimeDB.findOneByCode('BATCH')
      if (!refreshTime) {
        refreshTime = { code: 'BATCH', dataVersion: 0, time: new Date(0).toISOString() }
      }
      const dataVersion = useMeStore().organization.dataVersionParse.batch

      let apiResponse: { time: Date; data: Batch[] }

      if (refreshTime.dataVersion !== dataVersion) {
        await BatchDB.truncate()
        apiResponse = await BatchApi.list({})
      } else {
        const lastTime = new Date(refreshTime.time)
        apiResponse = await BatchApi.list({
          filter: { updatedAt: { GTE: lastTime } },
        })
      }

      if (apiResponse.data.length) {
        await BatchDB.upsertMany(apiResponse.data)
        refreshTime.time = apiResponse.time.toISOString()
        refreshTime.dataVersion = dataVersion
        await RefreshTimeDB.upsertOne(refreshTime)
      }

      return { numberChange: apiResponse.data.length }
    } catch (error: any) {
      console.log('🚀 ~ file: batch.service.ts:43 ~ BatchService ~ refreshDB ~ error:', error)
      AlertStore.add({ type: 'error', message: error.message })
      AuthService.logout()
      return
    }
  }

  static async pagination(params: BatchPaginationQuery) {
    const { page, limit, relation, filter, sort } = params

    let productList: Product[] | undefined
    if (filter?.product) {
      productList = await ProductDB.findManyBy({
        isActive: filter.product.isActive,
        productGroupId: filter.product.productGroupId,
        $OR: filter?.product.searchText
          ? [
              { brandName: { LIKE: filter.product.searchText } },
              { substance: { LIKE: filter.product.searchText } },
            ]
          : undefined,
      })
    }
    const batchPagination = await BatchDB.pagination({
      page: page || 1,
      limit: limit || 10,
      condition: {
        productId: productList ? { IN: productList.map((i) => i.id) } : undefined,
        expiryDate: filter?.expiryDate,
        warehouseId: filter?.warehouseId,
        distributorId: filter?.distributorId,
        quantity: filter?.quantity,
        $OR: filter?.$OR,
      },
      sort: sort || { id: 'DESC' },
    })
    const batchList = Batch.fromList(batchPagination.data)

    if (relation?.product && batchList.length) {
      if (!productList) {
        productList = await ProductDB.findMany({
          condition: { id: { IN: batchList.map((i) => i.productId) } },
        })
      }
      const productListMap = arrayToKeyValue(productList, 'id')
      batchList.forEach((i) => {
        i.product = Product.from(productListMap[i.productId])
      })
    }

    return {
      data: batchList,
      meta: {
        page,
        limit,
        total: batchPagination.total,
      },
    }
  }

  static async list(params: BatchListQuery) {
    const { filter, limit, sort } = params
    const objects = await BatchDB.findMany({
      limit,
      condition: {
        expiryDate: filter?.expiryDate,
        warehouseId: filter?.warehouseId,
        quantity: filter?.quantity,
        productId: filter?.productId,
        $OR: filter?.$OR,
      },
      sort,
    })
    return Batch.fromList(objects)
  }

  static async updateInfo(id: number, instance: Batch) {
    const response = await BatchApi.updateInfo(id, instance)
    await BatchDB.replaceOne(id, response)
    return response
  }

  static async updateInfoAndQuantityAndCostPrice(id: number, instance: Batch) {
    const response = await BatchApi.updateInfoAndQuantityAndCostPrice(id, instance)
    await BatchDB.replaceOne(id, response.batch)
    if (response.product) {
      await ProductDB.replaceOne(response.product.id, response.product)
    }
    return response
  }

  static async destroyOne(id: number) {
    const response = await BatchApi.destroyOne(id)
    if (response.success) {
      await BatchDB.deleteOneByKey(id)
    }
    return response
  }
}
