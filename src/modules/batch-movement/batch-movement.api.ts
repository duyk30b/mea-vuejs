import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  BatchMovementGetQuery,
  BatchMovementListQuery,
  type BatchMovementPaginationQuery,
} from './batch-movement.dto'
import { BatchMovement } from './batch-movement.model'

export class BatchMovementApi {
  static async pagination(options: BatchMovementPaginationQuery) {
    const params = BatchMovementGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/batch-movement/pagination', { params })
    const { data, meta } = response.data as BaseResponse

    return {
      meta,
      data: BatchMovement.fromPlains(data),
    }
  }

  static async list(options: BatchMovementListQuery) {
    const params = BatchMovementGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/batch-movement/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: BatchMovement.fromPlains(data),
    }
  }
}
