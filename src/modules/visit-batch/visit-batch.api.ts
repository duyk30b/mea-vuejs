import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { VisitBatchGetQuery, VisitBatchListQuery } from './visit-batch.dto'
import { VisitBatch } from './visit-batch.model'

export class VisitBatchApi {
  static async list(options: VisitBatchListQuery) {
    const params = VisitBatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/visit-batch/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: VisitBatch.fromPlains(data),
    }
  }
}
