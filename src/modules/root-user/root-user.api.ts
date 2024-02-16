import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { User } from '../user'
import { RootUserGetQuery, RootUserPaginationQuery } from './root-user.dto'

export class RootUserApi {
  static async pagination(options: RootUserPaginationQuery) {
    const params = RootUserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/root/user/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: User.fromPlains(data),
    }
  }

  static async createOne(instance: User) {
    const plain = User.toPlain(instance, 'ROOT_CREATE')

    const response = await AxiosInstance.post('/root/user/create', plain)
    const { data } = response.data as BaseResponse

    return User.fromPlain(data)
  }

  static async updateOne(id: number, instance: User) {
    const plain = User.toPlain(instance, 'ROOT_UPDATE')

    const response = await AxiosInstance.patch(`/root/user/update/${id}`, plain)
    const { data } = response.data as BaseResponse

    return User.fromPlain(data)
  }

  static async delete(userId: number) {
    const response = await AxiosInstance.get(`/root/user/delete/${userId}`)
    const { data } = response.data as BaseResponse

    return User.fromPlain(data)
  }

  static async deviceLogout(params: { oid: number; userId: number; code: string }) {
    const { oid, userId, code } = params
    const response = await AxiosInstance.post(`/root/user/device-logout/${userId}`, { code, oid })
    const { data } = response.data as BaseResponse
    return data
  }
}
