import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  CommissionDetailQuery,
  CommissionGetQuery,
  type CommissionListQuery,
  type CommissionPaginationQuery,
} from './commission.dto'
import { Commission } from './commission.model'

export class CommissionApi {
  static async pagination(options: CommissionPaginationQuery) {
    const params = CommissionGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/commission/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Commission.fromList(data),
    }
  }

  static async list(options: CommissionListQuery) {
    const params = CommissionGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/commission/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Commission.fromList(data),
    }
  }

  static async detail(id: number, options: CommissionDetailQuery = {}): Promise<Commission> {
    const params = CommissionGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/commission/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ commission: any }>
    return Commission.from(data.commission)
  }

  static async createOne(commission: Commission) {
    const response = await AxiosInstance.post('/commission/create', {
      roleId: commission.roleId,
      interactType: commission.interactType,
      interactId: commission.interactId,
      commissionValue: commission.commissionValue,
      commissionCalculatorType: commission.commissionCalculatorType,
    })
    const { data } = response.data as BaseResponse<{ commission: any }>
    return Commission.from(data.commission)
  }

  static async updateOne(id: number, commission: Commission) {
    const response = await AxiosInstance.patch(`/commission/update/${id}`, {
      roleId: commission.roleId,
      interactType: commission.interactType,
      interactId: commission.interactId,
      commissionValue: commission.commissionValue,
      commissionCalculatorType: commission.commissionCalculatorType,
    })
    const { data } = response.data as BaseResponse<{ commission: any }>
    return Commission.from(data.commission)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/commission/destroy/${id}`)
    const result = response.data as BaseResponse<boolean>
    return result
  }

  static async replaceList(options: {
    filter: CommissionGetQuery['filter']
    commissionData: Commission[]
  }) {
    const response = await AxiosInstance.put(`/commission/replace-list`, {
      filter: options.filter,
      commissionData: options.commissionData.map((i) => {
        return {
          interactType: i.interactType,
          roleId: i.roleId,
          interactId: i.interactId,
          commissionValue: i.commissionValue,
          commissionCalculatorType: i.commissionCalculatorType,
        }
      }),
    })
    const { data } = response.data as BaseResponse<{ commissionList: any[] }>
    return Commission.fromList(data.commissionList)
  }
}
