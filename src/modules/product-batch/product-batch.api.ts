import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import {
  ProductBatchDetailQuery,
  ProductBatchGetQuery,
  ProductBatchListQuery,
  ProductBatchPaginationQuery,
} from './product-batch.dto'
import { ProductBatch } from './product-batch.model'

export class ProductBatchApi {
  static async pagination(options: ProductBatchPaginationQuery) {
    const params = ProductBatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product-batch/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: ProductBatch.fromPlains(data),
    }
  }

  static async list(options: ProductBatchListQuery) {
    const params = ProductBatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/product-batch/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: ProductBatch.fromPlains(data),
    }
  }

  static async detail(id: number, options: ProductBatchDetailQuery) {
    const params = ProductBatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/product-batch/detail/${id}`, { params })
    const { data } = response.data as BaseResponse
    return ProductBatch.fromPlain(data)
  }

  static async createOne(instance: ProductBatch) {
    const plain = ProductBatch.toPlain(instance, USER_CREATE)
    const response = await AxiosInstance.post('/product-batch/create', plain)
    const { data } = response.data as BaseResponse
    return ProductBatch.fromPlain(data)
  }

  static async updateOne(id: number, instance: ProductBatch) {
    const plain = ProductBatch.toPlain(instance, USER_UPDATE)
    const response = await AxiosInstance.patch(`/product-batch/update/${id}`, plain)
    const { data } = response.data as BaseResponse
    return ProductBatch.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/product-batch/delete/${id}`)
    const { data } = response.data as BaseResponse
    return ProductBatch.fromPlain(data)
  }
}
