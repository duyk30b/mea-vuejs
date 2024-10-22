import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { UserDetailQuery, UserGetQuery, UserListQuery, UserPaginationQuery } from './user.dto'
import { User } from './user.model'

export class UserApi {
  static async pagination(options: UserPaginationQuery) {
    const params = UserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/user/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: User.fromList(data),
    }
  }

  static async list(options: UserListQuery): Promise<User[]> {
    const params = UserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/user/list', { params })
    const { data } = response.data as BaseResponse
    return User.fromList(data)
  }

  static async detail(id: number, options?: UserDetailQuery): Promise<User> {
    const params = UserGetQuery.toQuery(options || {})

    const response = await AxiosInstance.get(`/user/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ user: any }>
    return User.from(data.user)
  }

  static async createOne(user: User, roleIdList: number[]) {
    const response = await AxiosInstance.post('/user/create', {
      phone: user.phone,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      birthday: user.birthday,
      gender: user.gender,
      isActive: user.isActive,

      roleIdList,
    })
    const { data } = response.data as BaseResponse<{ user: any }>
    return User.from(data.user)
  }

  static async updateOne(id: number, user: User, roleIdList: number[]) {
    const response = await AxiosInstance.patch(`/user/update/${id}`, {
      phone: user.phone,
      // username: user.username,
      // password: user.password,
      fullName: user.fullName,
      birthday: user.birthday,
      gender: user.gender,
      isActive: user.isActive,

      roleIdList,
    })
    const { data } = response.data as BaseResponse<{ user: any }>
    return User.from(data.user)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/user/delete/${id}`)
    const { data } = response.data as BaseResponse<{ userId: number }>
    return data
  }

  static async deviceLogout(userId: number, refreshExp: number) {
    const response = await AxiosInstance.post(`/user/device-logout/${userId}`, { refreshExp })
    const { data } = response.data as BaseResponse
    return data
  }
}
