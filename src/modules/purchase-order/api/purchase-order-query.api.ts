import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import {
  PurchaseOrderDetailQuery,
  PurchaseOrderGetQuery,
  PurchaseOrderListQuery,
  PurchaseOrderPaginationQuery,
} from '../purchase-order.dto'
import { PurchaseOrder } from '../purchase-order.model'

export class PurchaseOrderQueryApi {
  static async pagination(options: PurchaseOrderPaginationQuery) {
    const params = PurchaseOrderGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/purchase-order/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      page: data.page,
      total: data.total,
      limit: data.limit,
      purchaseOrderList: PurchaseOrder.fromList(data.purchaseOrderList),
    }
  }

  static async list(options: PurchaseOrderListQuery) {
    const params = PurchaseOrderGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/purchase-order/list', { params })
    const { data } = response.data as BaseResponse
    return PurchaseOrder.fromList(data.purchaseOrderList)
  }

  static async detail(
    purchaseOrderId: string,
    options: PurchaseOrderDetailQuery,
  ): Promise<PurchaseOrder> {
    const params = PurchaseOrderGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/purchase-order/${purchaseOrderId}/detail`, {
      params,
    })
    const { data } = response.data as BaseResponse<{ purchaseOrder: any }>
    return PurchaseOrder.from(data.purchaseOrder)
  }
}
