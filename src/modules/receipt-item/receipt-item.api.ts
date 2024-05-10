import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Batch } from '../batch'
import { Product } from '../product'
import {
  ProductAndBatchUpsertBody,
  ReceiptItemGetQuery,
  type ReceiptItemPaginationQuery,
} from './receipt-item.dto'
import { ReceiptItem } from './receipt-item.model'

export class ReceiptItemApi {
  static async pagination(options: ReceiptItemPaginationQuery) {
    const params = ReceiptItemGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/receipt-item/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: ReceiptItem.fromPlains(data),
    }
  }

  static async upsertProductAndBatch(body: ProductAndBatchUpsertBody) {
    const response = await AxiosInstance.post('/receipt-item/upsert-product-and-batch', body)
    const { data } = response.data as BaseResponse
    return {
      product: data.product ? Product.fromPlain(data.product) : null,
      batch: data.batch ? Batch.fromPlain(data.batch) : null,
    }
  }
}
