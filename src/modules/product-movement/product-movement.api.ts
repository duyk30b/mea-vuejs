import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  ProductMovementGetQuery,
  type ProductMovementPaginationQuery,
} from './product-movement.dto'
import { ProductMovement } from './product-movement.model'

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
