import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { ProductMovement, ProductMovementType } from './product-movement.model'

export class ProductMovementGetQuery {
  page?: number
  limit?: number
  relation?: {
    productBatch?: boolean
    invoice?: boolean
    receipt?: boolean
  }

  filter?: {
    productId?: number
    productBatchId?: number
    type?: ProductMovementType
  }

  sort?: {
    id?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ProductMovementGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ProductMovementPaginationQuery extends ProductMovementGetQuery {}

export class ProductMovementApi {
  static async pagination(options: ProductMovementPaginationQuery) {
    const params = ProductMovementGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product-movement/pagination', { params })
    const { data, meta } = response.data as BaseResponse

    return {
      meta,
      data: ProductMovement.fromPlains(data),
    }
  }
}
