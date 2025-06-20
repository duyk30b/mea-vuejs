import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Product } from '../product'
import { ReceiptItem } from '../receipt-item/receipt-item.model'
import { TicketBatch } from '../ticket-batch'
import { TicketProduct } from '../ticket-product'
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
    const { data, time } = response.data as BaseResponse<{ batchList: any[] }>
    return {
      time: new Date(time),
      batchList: Batch.fromList(data.batchList),
    }
  }

  static async detail(id: number, options: BatchDetailQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/batch/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ batch: any }>
    return Batch.from(data.batch)
  }

  static async updateInfo(id: number, batch: Batch) {
    const response = await AxiosInstance.patch(`/batch/update-info/${id}`, {
      lotNumber: batch.lotNumber,
      expiryDate: batch.expiryDate != null ? batch.expiryDate : null,
      warehouseId: batch.warehouseId,
      isActive: batch.isActive,
    })
    const { data } = response.data as BaseResponse<{ batch: any }>
    return Batch.from(data.batch)
  }

  static async updateInfoAndQuantityAndCostPrice(id: number, batch: Batch) {
    const response = await AxiosInstance.patch(
      `/batch/update-info-and-quantity-and-cost-price/${id}`,
      {
        lotNumber: batch.lotNumber,
        expiryDate: batch.expiryDate != null ? batch.expiryDate : null,
        warehouseId: batch.warehouseId,
        distributorId: batch.distributorId,
        quantity: batch.quantity,
        costAmount: batch.costAmount,
        costPrice: batch.costPrice,
        isActive: batch.isActive,
      },
    )
    const { data } = response.data as BaseResponse<{ batch: any; product?: any }>
    return {
      batch: Batch.from(data.batch),
      product: data.product ? Product.from(data.product) : undefined,
    }
  }

  static async mergeBatch(options: {
    productId: number
    batchIdSourceList: number[]
    batchIdTarget: number
  }) {
    const response = await AxiosInstance.patch(`/batch/merge-batch`, {
      productId: options.productId,
      batchIdSourceList: options.batchIdSourceList,
      batchIdTarget: options.batchIdTarget,
    })
    const { data } = response.data as BaseResponse<boolean>
    return data
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/batch/destroy/${id}`)
    const result = response.data as BaseResponse<{
      batchId: number
      receiptItemList: ReceiptItem[]
      ticketBatchList: TicketBatch[]
      ticketProductList: TicketProduct[]
    }>
    result.data.receiptItemList = ReceiptItem.fromList(result.data.receiptItemList)
    result.data.ticketBatchList = TicketBatch.fromList(result.data.ticketBatchList)
    result.data.ticketProductList = TicketProduct.fromList(result.data.ticketProductList)
    return result
  }
}
