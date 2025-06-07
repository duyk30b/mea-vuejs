import { AlertStore } from '../../common/vue-alert'
import { BatchDB } from '../../core/indexed-db/repository/batch.repository'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { useMeStore } from '../_me/me.store'
import { AuthService } from '../auth/auth.service'
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

      let apiResponse: { time: Date; batchList: Batch[] }

      if (refreshTime.dataVersion !== dataVersion) {
        await BatchDB.truncate()
        apiResponse = await BatchApi.list({})
      } else {
        const lastTime = new Date(refreshTime.time)
        apiResponse = await BatchApi.list({
          filter: { updatedAt: { GTE: lastTime } },
        })
      }

      if (apiResponse.batchList.length) {
        await BatchDB.upsertMany(apiResponse.batchList)
        refreshTime.time = apiResponse.time.toISOString()
        refreshTime.dataVersion = dataVersion
        await RefreshTimeDB.upsertOne(refreshTime)
      }

      return { numberChange: apiResponse.batchList.length }
    } catch (error: any) {
      console.log('🚀 ~ file: product.service.ts:43 ~ BatchService ~ refreshDB ~ error:', error)
      AlertStore.add({ type: 'error', message: error.message })
      AuthService.logout()
      return
    }
  }

  static async pagination(params: BatchPaginationQuery) {
    return await BatchApi.pagination(params)
  }

  static async list(query: BatchListQuery, options?: { refresh: boolean }) {
    if (options?.refresh) {
      await BatchService.refreshDB()
    }
    // const { time, batchList } = await BatchApi.list(query)
    const { filter } = query
    const batchList = await BatchDB.findMany({
      limit: query.limit,
      condition: {
        id: filter?.id,
        productId: filter?.productId,
        quantity: filter?.quantity,
        $OR: filter?.$OR as any,
      },
      sort: query.sort,
    })
    return Batch.fromList(batchList)
  }

  static async updateInfo(id: number, instance: Batch) {
    const response = await BatchApi.updateInfo(id, instance)
    return response
  }

  static async updateInfoAndQuantityAndCostPrice(id: number, instance: Batch) {
    const response = await BatchApi.updateInfoAndQuantityAndCostPrice(id, instance)
    if (response.product) {
      await ProductDB.replaceOne(response.product.id, response.product)
    }
    return response
  }

  static async destroyOne(id: number) {
    const response = await BatchApi.destroyOne(id)
    return response
  }
}
