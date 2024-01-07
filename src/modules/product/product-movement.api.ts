import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { ProductMovement, ProductMovementType } from './product-movement.model'

export interface ProductMovementPaginationQuery extends ApiPaginationRequest {
  filter?: {
    productId?: number
    productBatchId?: number
    type?: ProductMovementType
  }
  relation?: {
    productBatch?: boolean
    invoice?: boolean
    receipt?: boolean
  }
}
export class ProductMovementApi {
  static async pagination(params: ProductMovementPaginationQuery) {
    const response = await AxiosInstance.get('/product-movement/pagination', { params })
    const data = response.data as ApiPaginationResponse

    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: ProductMovement.fromPlains(data.data),
    }
  }
}
