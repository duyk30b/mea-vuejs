import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { UserDetailQuery, UserGetQuery, UserListQuery, UserPaginationQuery } from './user.dto'
import { User } from './user.model'

export class UserApi {
  static async pagination(options: UserPaginationQuery) {
    const params = UserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/user/pagination', { params })
    const { data, meta } = response.data as FullResponse

    return {
      userList: User.fromList(data.userList),
      total: data.total,
      page: data.page,
      limit: data.limit,
    }
  }

  static async list(options: UserListQuery): Promise<User[]> {
    const params = UserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/user/list', { params })
    const { data } = response.data as FullResponse
    return User.fromList(data)
  }

  static async detail(id: number, options?: UserDetailQuery): Promise<User> {
    const params = UserGetQuery.toQuery(options || {})

    const response = await AxiosInstance.get(`/user/detail/${id}`, { params })
    const { data } = response.data as FullResponse<{ user: any }>
    return User.from(data.user)
  }

  static async createOne(body: {
    user: User
    roleIdList: number[]
    roomIdList: number[]
    account: { username: string; password: string }
  }) {
    const { user, account, roleIdList, roomIdList } = body
    const response = await AxiosInstance.post('/user/create', {
      user: {
        phone: user.phone,
        fullName: user.fullName,
        birthday: user.birthday,
        gender: user.gender,
        isActive: user.isActive,
      },
      account,
      roomIdList,
      roleIdList,
    })
    const { data } = response.data as FullResponse<{ user: any }>
    return User.from(data.user)
  }

  static async updateOne(
    id: number,
    body: {
      user: User
      account?: { username: string; password: string }
      roleIdList?: number[]
      roomIdList?: number[]
    },
  ) {
    const { user, account, roleIdList, roomIdList } = body
    const response = await AxiosInstance.post(`/user/update/${id}`, {
      user: {
        phone: user.phone,
        fullName: user.fullName,
        birthday: user.birthday,
        gender: user.gender,
        isActive: user.isActive,
      },
      account,
      roomIdList,
      roleIdList,
    })
    const { data } = response.data as FullResponse<{ user: any }>
    return User.from(data.user)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.post(`/user/delete/${id}`)
    const { data } = response.data as FullResponse<{ userId: number }>
    return data
  }

  static async deviceLogout(userId: number, clientId: string) {
    const response = await AxiosInstance.post(`/user/device-logout/${userId}`, { clientId })
    const { data } = response.data as FullResponse
    return data
  }
}
