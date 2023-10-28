import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { UserGetQuery, UserListQuery, UserPaginationQuery } from './user.dto'
import { User } from './user.model'

export class UserApi {
  static async pagination(options: UserPaginationQuery) {
    const params = UserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/user/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: User.fromPlains(data),
    }
  }

  static async list(options: UserListQuery): Promise<User[]> {
    const params = UserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/user/list', { params })
    const { data } = response.data as BaseResponse
    return User.fromPlains(data)
  }

  static async detail(id: number): Promise<User> {
    const response = await AxiosInstance.get(`/user/detail/${id}`)
    const { data } = response.data as BaseResponse
    return User.fromPlain(data)
  }

  static async createOne(instance: User) {
    const plain = User.toPlain(instance, 'ADMIN_CREATE')
    const response = await AxiosInstance.post('/user/create', plain)
    const { data } = response.data as BaseResponse
    return User.fromPlain(data)
  }

  static async updateOne(id: number, instance: User) {
    const plain = User.toPlain(instance, 'ADMIN_UPDATE')
    const response = await AxiosInstance.patch(`/user/update/${id}`, plain)
    const { data } = response.data as BaseResponse
    return User.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/user/delete/${id}`)
    const { data } = response.data as BaseResponse
    return User.fromPlain(data)
  }

  static async deviceLogout(userId: number, code: string) {
    const response = await AxiosInstance.post(`/user/device-logout/${userId}`, { code })
    const { data } = response.data as BaseResponse
    return data
  }
}
