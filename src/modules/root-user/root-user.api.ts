import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { ApiPaginationResponse } from '../pagination'
import { User } from '../user'
import { RootUserGetQuery, RootUserPaginationQuery } from './root-user.dto'

export class RootUserApi {
  static async pagination(options: RootUserPaginationQuery) {
    const params = RootUserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/root/user/pagination', { params })
    const responseData = response.data as BaseResponse<ApiPaginationResponse>
    return {
      total: responseData.data.total,
      page: responseData.data.page,
      limit: responseData.data.limit,
      data: User.fromPlains(responseData.data.data),
    }
  }

  static async createOne(instance: User) {
    const plain = User.toPlain(instance, 'ROOT_CREATE')

    const response = await AxiosInstance.post('/root/user/create', plain)
    const responseData = response.data as BaseResponse

    return User.fromPlain(responseData.data)
  }

  static async updateOne(id: number, instance: User) {
    const plain = User.toPlain(instance, 'ROOT_UPDATE')

    const response = await AxiosInstance.patch(`/root/user/update/${id}`, plain)
    const responseData = response.data as BaseResponse

    return User.fromPlain(responseData.data)
  }

  static async delete(userId: number) {
    const response = await AxiosInstance.get(`/root/user/delete/${userId}`)
    const responseData = response.data as BaseResponse

    return User.fromPlain(responseData.data)
  }
}
