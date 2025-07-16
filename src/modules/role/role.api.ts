import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { RoleDetailQuery, RoleGetQuery, RoleListQuery, RolePaginationQuery } from './role.dto'
import { Role } from './role.model'

export class RoleApi {
  static async pagination(options: RolePaginationQuery) {
    const params = RoleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/role/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Role.fromList(data),
    }
  }

  static async list(options: RoleListQuery): Promise<Role[]> {
    const params = RoleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/role/list', { params })
    const { data } = response.data as BaseResponse
    return Role.fromList(data)
  }

  static async detail(id: number, options: RoleDetailQuery): Promise<Role> {
    const params = RoleGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/role/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ role: any }>

    return Role.from(data.role)
  }

  static async createOne(role: Role, userIdList: number[]) {
    const response = await AxiosInstance.post('/role/create', {
      name: role.name,
      displayName: role.displayName || '',
      permissionIds: role.permissionIds,
      isActive: role.isActive,

      userIdList,
    })
    const { data } = response.data as BaseResponse<{ role: any }>

    return Role.from(data.role)
  }

  static async updateOne(id: number, role: Role, userIdList: number[]) {
    const response = await AxiosInstance.patch(`/role/update/${id}`, {
      name: role.name,
      displayName: role.displayName || '',
      permissionIds: role.permissionIds,
      isActive: role.isActive,

      userIdList,
    })
    const { data } = response.data as BaseResponse<{ role: any }>

    return Role.from(data.role)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/role/destroy/${id}`)
    const result = response.data as BaseResponse<{ roleId: number }>

    return result
  }
}
