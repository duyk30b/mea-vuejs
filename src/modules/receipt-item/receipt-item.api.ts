import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { ReceiptItemGetQuery, type ReceiptItemPaginationQuery } from './receipt-item.dto'
import { ReceiptItem } from './receipt-item.model'

export class ReceiptItemApi {
  static async pagination(options: ReceiptItemPaginationQuery) {
    const params = ReceiptItemGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/receipt-item/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: ReceiptItem.fromList(data),
    }
  }
}
