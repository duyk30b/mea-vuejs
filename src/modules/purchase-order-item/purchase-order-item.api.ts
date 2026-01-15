import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { PurchaseOrderItemGetQuery, type PurchaseOrderItemPaginationQuery } from './purchase-order-item.dto'
import { PurchaseOrderItem } from './purchase-order-item.model'

export class PurchaseOrderItemApi {
  static async pagination(options: PurchaseOrderItemPaginationQuery) {
    const params = PurchaseOrderItemGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/purchase-order-item/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      limit: data.limit,
      total: data.total,
      purchaseOrderItemList: PurchaseOrderItem.fromList(data.purchaseOrderItemList),
    }
  }
}
