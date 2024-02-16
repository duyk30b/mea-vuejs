import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { RoleGetQuery, RoleListQuery, RolePaginationQuery } from './role.dto'
import { Role } from './role.model'

export class RoleApi {
  static async pagination(options: RolePaginationQuery) {
    const params = RoleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/role/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Role.fromPlains(data),
    }
  }

  static async list(options: RoleListQuery): Promise<Role[]> {
    const params = RoleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/role/list', { params })
    const { data } = response.data as BaseResponse
    return Role.fromPlains(data)
  }

  static async detail(id: number): Promise<Role> {
    const response = await AxiosInstance.get(`/role/detail/${id}`)
    const { data } = response.data as BaseResponse
    return Role.fromPlain(data)
  }

  static async createOne(instance: Role) {
    const plain = Role.toPlain(instance, USER_CREATE)
    const response = await AxiosInstance.post('/role/create', plain)
    const { data } = response.data as BaseResponse

    return Role.fromPlain(data)
  }

  static async updateOne(id: number, instance: Role) {
    const plain = Role.toPlain(instance, USER_UPDATE)
    const response = await AxiosInstance.patch(`/role/update/${id}`, plain)
    const { data } = response.data as BaseResponse

    return Role.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/role/delete/${id}`)
    const { data } = response.data as BaseResponse

    return Role.fromPlain(data)
  }
}
