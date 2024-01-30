import { AxiosInstance } from '../../core/axios.instance'
import type { ApiPaginationResponse } from '../pagination'
import { RoleGetQuery, RoleListQuery, RolePaginationQuery } from './role.dto'
import { Role } from './role.model'

export class RoleApi {
  static async pagination(options: RolePaginationQuery) {
    const params = RoleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/role/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Role.fromPlains(data.data),
    }
  }

  static async list(options: RoleListQuery): Promise<Role[]> {
    const params = RoleGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get('/role/list', { params })
    return Role.fromPlains(data)
  }

  static async detail(id: number): Promise<Role> {
    const { data } = await AxiosInstance.get(`/role/detail/${id}`)
    return Role.fromPlain(data)
  }

  static async createOne(instance: Role) {
    const plain = Role.toPlain(instance, 'CREATE')
    const { data } = await AxiosInstance.post('/role/create', plain)

    return Role.fromPlain(data)
  }

  static async updateOne(id: number, instance: Role) {
    const plain = Role.toPlain(instance, 'UPDATE')
    const response = await AxiosInstance.patch(`/role/update/${id}`, plain)

    return Role.fromPlain(response.data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/role/delete/${id}`)

    return Role.fromPlain(response.data)
  }
}
