import { AlertStore } from '../../common/vue-alert/vue-alert.store'
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
  static async pagination(params: BatchPaginationQuery) {
    return await BatchApi.pagination(params)
  }

  static async list(query: BatchListQuery) {
    const { time, batchList } = await BatchApi.list(query)
    return batchList
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
