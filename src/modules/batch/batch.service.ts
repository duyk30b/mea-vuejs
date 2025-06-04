import { ProductDB } from '../../core/indexed-db/repository/product.repository'
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
