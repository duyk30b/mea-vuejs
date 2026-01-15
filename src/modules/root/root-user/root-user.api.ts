import { AxiosInstance } from '../../../core/axios.instance'
import type { FullResponse } from '../../_base/base-dto'
import { User } from '../../user'
import { RootUserGetQuery, RootUserPaginationQuery } from './root-user.dto'

export class RootUserApi {
  static async pagination(options: RootUserPaginationQuery) {
    const params = RootUserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/root/user/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      userList: User.fromList(data.userList),
      total: data.total,
      page: data.page,
      limit: data.limit,
    }
  }

  static async createOne(user: User) {
    const response = await AxiosInstance.post('/root/user/create', {
      oid: user.oid,
      phone: user.phone,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      birthday: user.birthday,
      gender: user.gender,

      isAdmin: user.isAdmin,
      isActive: user.isActive,
    })
    const { data } = response.data as FullResponse<{ user: any }>

    return User.from(data.user)
  }

  static async updateOne(id: number, user: User) {
    const response = await AxiosInstance.post(`/root/user/update/${id}`, {
      phone: user.phone,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      birthday: user.birthday,

      isAdmin: user.isAdmin,
      isActive: user.isActive,
    })
    const { data } = response.data as FullResponse<{ user: any }>

    return User.from(data.user)
  }

  static async delete(userId: number) {
    const response = await AxiosInstance.get(`/root/user/delete/${userId}`)
    const { data } = response.data as FullResponse<{ userId: number }>

    return data
  }

  static async deviceLogout(params: { oid: number; userId: number; clientId: string }) {
    const { oid, userId, clientId } = params
    const response = await AxiosInstance.post(`/root/user/device-logout/${userId}`, {
      clientId,
      oid,
    })
    const { data } = response.data as FullResponse
    return data
  }

  static async logoutAll() {
    const response = await AxiosInstance.post(`/root/user/logout-all`)
    const { data } = response.data as FullResponse
    return data
  }
}
