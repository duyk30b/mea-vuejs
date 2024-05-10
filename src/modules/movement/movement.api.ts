import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { BatchMovementGetQuery, type BatchMovementPaginationQuery } from './bat-movement.dto'
import { BatchMovement } from './bat-movement.model'
import {
  ProductMovementGetQuery,
  type ProductMovementPaginationQuery,
} from './product-movement.dto'
import { ProductMovement } from './product-movement.model'

export class MovementApi {
  static async paginationProduct(options: ProductMovementPaginationQuery) {
    const params = ProductMovementGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/movement/pagination-product', { params })
    const { data, meta } = response.data as BaseResponse

    return {
      meta,
      data: ProductMovement.fromPlains(data),
    }
  }

  static async paginationBatch(options: BatchMovementPaginationQuery) {
    const params = BatchMovementGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/movement/pagination-batch', { params })
    const { data, meta } = response.data as BaseResponse

    return {
      meta,
      data: BatchMovement.fromPlains(data),
    }
  }
}
