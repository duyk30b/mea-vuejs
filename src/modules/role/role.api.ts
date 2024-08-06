import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { RoleGetQuery, RoleListQuery, RolePaginationQuery } from './role.dto'
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

  static async detail(id: number): Promise<Role> {
    const response = await AxiosInstance.get(`/role/detail/${id}`)
    const { data } = response.data as BaseResponse<{ role: any }>

    return Role.from(data.role)
  }

  static async createOne(role: Role) {
    const response = await AxiosInstance.post('/role/create', {
      name: role.name,
      permissionIds: role.permissionIds,
      isActive: role.isActive,
    })
    const { data } = response.data as BaseResponse<{ role: any }>

    return Role.from(data.role)
  }

  static async updateOne(id: number, role: Role) {
    const response = await AxiosInstance.patch(`/role/update/${id}`, {
      name: role.name,
      permissionIds: role.permissionIds,
      isActive: role.isActive,
    })
    const { data } = response.data as BaseResponse<{ role: any }>

    return Role.from(data.role)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/role/delete/${id}`)
    const { data } = response.data as BaseResponse<{ roleId: number }>

    return data
  }
}
