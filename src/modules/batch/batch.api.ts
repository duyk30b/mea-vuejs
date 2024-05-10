import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { BatchDetailQuery, BatchGetQuery, BatchListQuery, BatchPaginationQuery } from './batch.dto'
import { Batch } from './batch.model'

export class BatchApi {
  static async pagination(options: BatchPaginationQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/batch/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Batch.fromPlains(data),
    }
  }

  static async list(options: BatchListQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/batch/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Batch.fromPlains(data),
    }
  }

  static async detail(id: number, options: BatchDetailQuery) {
    const params = BatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/batch/detail/${id}`, { params })
    const { data } = response.data as BaseResponse
    return Batch.fromPlain(data)
  }

  static async createOne(instance: Batch) {
    const plain = Batch.toPlain(instance, USER_CREATE)
    const response = await AxiosInstance.post('/batch/create', plain)
    const { data } = response.data as BaseResponse
    return Batch.fromPlain(data)
  }

  static async updateOne(id: number, instance: Batch) {
    const plain = Batch.toPlain(instance, USER_UPDATE)
    const response = await AxiosInstance.patch(`/batch/update/${id}`, plain)
    const { data } = response.data as BaseResponse
    return Batch.fromPlain(data)
  }
}
