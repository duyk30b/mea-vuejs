import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  PositionDetailQuery,
  PositionGetQuery,
  type PositionListQuery,
  type PositionPaginationQuery,
} from './position.dto'
import { Position } from './position.model'

export class PositionApi {
  static async pagination(options: PositionPaginationQuery) {
    const params = PositionGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/position/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      page: data.page,
      total: data.total,
      limit: data.limit,
      positionList: Position.fromList(data.positionList),
    }
  }

  static async list(options: PositionListQuery) {
    const params = PositionGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/position/list', { params })
    const { data, time } = response.data as BaseResponse<{ positionList: any[] }>
    return Position.fromList(data.positionList)
  }

  static async detail(id: number, options: PositionDetailQuery = {}): Promise<Position> {
    const params = PositionGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/position/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ position: any }>
    return Position.from(data.position)
  }

  static async createOne(position: Position) {
    const response = await AxiosInstance.post('/position/create', {
      priority: position.priority,
      roleId: position.roleId,
      positionType: position.positionType,
      positionInteractId: position.positionInteractId,
      commissionValue: position.commissionValue,
      commissionCalculatorType: position.commissionCalculatorType,
    })
    const { data } = response.data as BaseResponse<{ position: any }>
    return Position.from(data.position)
  }

  static async updateOne(id: number, position: Position) {
    const response = await AxiosInstance.patch(`/position/update/${id}`, {
      priority: position.priority,
      commissionCalculatorType: position.commissionCalculatorType,
      commissionValue: position.commissionValue,
    })
    const { data } = response.data as BaseResponse<{ position: any }>
    return Position.from(data.position)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/position/destroy/${id}`)
    const result = response.data as BaseResponse<boolean>
    return result
  }

  static async replaceList(options: {
    filter: PositionGetQuery['filter']
    positionData: Position[]
  }) {
    const response = await AxiosInstance.put(`/position/replace-list`, {
      filter: options.filter,
      positionData: options.positionData.map((i) => {
        return {
          priority: i.priority,
          positionType: i.positionType,
          roleId: i.roleId,
          positionInteractId: i.positionInteractId,
          commissionValue: i.commissionValue,
          commissionCalculatorType: i.commissionCalculatorType,
        }
      }),
    })
    const { data } = response.data as BaseResponse<{ positionList: any[] }>
    return Position.fromList(data.positionList)
  }
}
