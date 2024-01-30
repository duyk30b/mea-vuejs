import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { ApiPaginationResponse } from '../pagination'
import { UserGetQuery, UserListQuery, UserPaginationQuery } from './user.dto'
import { User } from './user.model'

export class UserApi {
  static async pagination(options: UserPaginationQuery) {
    const params = UserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/user/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: User.fromPlains(data.data),
    }
  }

  static async list(options: UserListQuery): Promise<User[]> {
    const params = UserGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get('/user/list', { params })
    return User.fromPlains(data)
  }

  static async detail(id: number): Promise<User> {
    const { data } = await AxiosInstance.get(`/user/detail/${id}`)
    return User.fromPlain(data)
  }

  static async createOne(instance: User) {
    const plain = User.toPlain(instance, 'USER_CREATE')
    const { data } = await AxiosInstance.post('/user/create', plain)

    return User.fromPlain(data)
  }

  static async updateOne(id: number, instance: User) {
    const plain = User.toPlain(instance, 'USER_UPDATE')
    const response = await AxiosInstance.patch(`/user/update/${id}`, plain)

    return User.fromPlain(response.data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/user/delete/${id}`)

    return User.fromPlain(response.data)
  }
}
