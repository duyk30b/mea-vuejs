import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { ReceiptItem } from '../receipt-item/receipt-item.model'
import { BatchDetailQuery, BatchGetQuery, BatchListQuery, BatchPaginationQuery } from './batch.dto'
import { Batch } from './batch.model'

export class BatchApi {
  static async pagination(options: BatchPaginationQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/batch/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Batch.fromList(data),
    }
  }

  static async list(options: BatchListQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/batch/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Batch.fromList(data),
    }
  }

  static async detail(id: number, options: BatchDetailQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/batch/detail/${id}`, { params })
    const { data } = response.data as BaseResponse
    return Batch.from(data)
  }

  static async createOne(instance: Batch) {
    const plain = Batch.from(instance)
    const response = await AxiosInstance.post('/batch/create', plain)
    const { data } = response.data as BaseResponse
    return Batch.from(data)
  }

  static async updateOne(id: number, batch: Batch) {
    const response = await AxiosInstance.patch(`/batch/update/${id}`, {
      lotNumber: batch.lotNumber,
      expiryDate: batch.expiryDate != null ? batch.expiryDate : null,
      wholesalePrice: batch.wholesalePrice,
      retailPrice: batch.retailPrice,
    })
    const { data } = response.data as BaseResponse
    return Batch.from(data)
  }

  static async findOrCreate(receiptItem: ReceiptItem) {
    const response = await AxiosInstance.post('/batch/find-or-create', {
      productId: receiptItem.productId,
      lotNumber: receiptItem.lotNumber || '',
      expiryDate: receiptItem.expiryDate,
      costPrice: receiptItem.costPrice,
      wholesalePrice: receiptItem.wholesalePrice,
      retailPrice: receiptItem.retailPrice,
    })
    const { data } = response.data as BaseResponse<{ batch: any }>
    return Batch.from(data.batch)
  }
}
