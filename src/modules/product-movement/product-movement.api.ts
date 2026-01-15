import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
    ProductMovementGetQuery,
    type ProductMovementPaginationQuery,
} from './product-movement.dto'
import { ProductMovement } from './product-movement.model'

export class ProductMovementApi {
  static async pagination(options: ProductMovementPaginationQuery) {
    const params = ProductMovementGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product-movement/pagination', { params })
    const { data, meta } = response.data as FullResponse

    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      productMovementList: ProductMovement.fromList(data.productMovementList),
    }
  }
}
