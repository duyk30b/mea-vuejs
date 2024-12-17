import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  RoleCommissionDetailQuery,
  RoleCommissionGetQuery,
  type RoleCommissionListQuery,
  type RoleCommissionPaginationQuery,
} from './role-commission.dto'
import { RoleCommission } from './role-commission.model'

export class RoleCommissionApi {
  static async pagination(options: RoleCommissionPaginationQuery) {
    const params = RoleCommissionGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/role-commission/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: RoleCommission.fromList(data),
    }
  }

  static async list(options: RoleCommissionListQuery) {
    const params = RoleCommissionGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/role-commission/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: RoleCommission.fromList(data),
    }
  }

  static async detail(
    id: number,
    options: RoleCommissionDetailQuery = {}
  ): Promise<RoleCommission> {
    const params = RoleCommissionGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/role-commission/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ roleCommission: any }>
    return RoleCommission.from(data.roleCommission)
  }

  static async createOne(roleCommission: RoleCommission) {
    const response = await AxiosInstance.post('/role-commission/create', {
      roleInteractType: roleCommission.roleInteractType,
      roleId: roleCommission.roleId,
      itemId: roleCommission.itemId,
      commissionValue: roleCommission.commissionValue,
      commissionCalculatorType: roleCommission.commissionCalculatorType,
    })
    const { data } = response.data as BaseResponse<{ roleCommission: any }>
    return RoleCommission.from(data.roleCommission)
  }

  static async updateOne(id: number, roleCommission: RoleCommission) {
    const response = await AxiosInstance.patch(`/role-commission/update/${id}`, {
      roleInteractType: roleCommission.roleInteractType,
      roleId: roleCommission.roleId,
      itemId: roleCommission.itemId,
      commissionValue: roleCommission.commissionValue,
      commissionCalculatorType: roleCommission.commissionCalculatorType,
    })
    const { data } = response.data as BaseResponse<{ roleCommission: any }>
    return RoleCommission.from(data.roleCommission)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/role-commission/destroy/${id}`)
    const result = response.data as BaseResponse<boolean>
    return result
  }
}
