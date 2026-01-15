import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { Product } from '../product'
import { BatchDetailQuery, BatchGetQuery, BatchListQuery, BatchPaginationQuery } from './batch.dto'
import { Batch } from './batch.model'

export class BatchApi {
  static async pagination(options: BatchPaginationQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/batch/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      total: data.total,
      limit: data.limit,
      batchList: Batch.fromList(data.batchList),
    }
  }

  static async list(options: BatchListQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/batch/list', { params })
    const { data, time } = response.data as FullResponse<{ batchList: any[] }>
    return {
      time: new Date(time),
      batchList: Batch.fromList(data.batchList),
    }
  }

  static async detail(id: number, options: BatchDetailQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/batch/detail/${id}`, { params })
    const { data } = response.data as FullResponse<{ batch: any }>
    return Batch.from(data.batch)
  }

  static async updateInfo(id: number, batch: Batch) {
    const response = await AxiosInstance.post(`/batch/update-info/${id}`, {
      lotNumber: batch.lotNumber,
      expiryDate: batch.expiryDate != null ? batch.expiryDate : null,
      warehouseId: batch.warehouseId,
    })
    const { data } = response.data as FullResponse<{ batch: any }>
    return Batch.from(data.batch)
  }

  static async updateInfoAndQuantityAndCostPrice(id: number, batch: Batch) {
    const response = await AxiosInstance.post(
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
    const { data } = response.data as FullResponse<{ batch: any; product?: any }>
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
    const response = await AxiosInstance.post(`/batch/merge-batch`, {
      productId: options.productId,
      batchIdSourceList: options.batchIdSourceList,
      batchIdTarget: options.batchIdTarget,
    })
    const { data } = response.data as FullResponse<boolean>
    return data
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/batch/destroy/${id}`)
    const responseData = response.data as FullResponse<{ batchId: number }>
    return responseData
  }
}
