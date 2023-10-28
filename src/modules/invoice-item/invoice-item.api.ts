import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { InvoiceItemGetQuery, type InvoiceItemPaginationQuery } from './invoice-item.dto'
import { InvoiceItem } from './invoice-item.model'

export class InvoiceItemApi {
  static async pagination(options: InvoiceItemPaginationQuery) {
    const params = InvoiceItemGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/invoice-item/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: InvoiceItem.fromPlains(data),
    }
  }
}
