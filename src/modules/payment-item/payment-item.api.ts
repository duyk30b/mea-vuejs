import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  PaymentItemGetQuery,
  PaymentItemListQuery,
  PaymentItemPaginationQuery
} from './payment-item.dto'
import { PaymentItem } from './payment-item.model'

export class PaymentItemApi {
  static async pagination(options: PaymentItemPaginationQuery) {
    const params = PaymentItemGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/payment-item/pagination', { params })
    const { data } = response.data as BaseResponse<{
      paymentItemList: any[]
      page: number
      limit: number
      total: number
    }>
    data.paymentItemList = PaymentItem.fromList(data.paymentItemList)
    return data
  }

  static async list(options: PaymentItemListQuery) {
    const params = PaymentItemGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/payment-item/list', { params })
    const { data } = response.data as BaseResponse<{ paymentItemList: any[] }>
    return PaymentItem.fromList(data.paymentItemList)
  }
}
