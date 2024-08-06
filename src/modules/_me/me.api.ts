import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Organization } from '../organization'
import { Permission } from '../permission/permission.model'
import { Role } from '../role'
import { User } from '../user/user.model'

export class MeApi {
  static async info() {
    const response = await AxiosInstance.get('/me/info')
    const { data } = response.data as BaseResponse
    return {
      user: User.from(data.user),
      organization: Organization.from(data.organization),
      role: Role.from(data.role),
      settingMap: data.settingMap as Record<string, any>,
      permissionList: Permission.fromList(data.permissionList),
    }
  }

  static async changePassword(oldPassword: string, newPassword: string) {
    const response = await AxiosInstance.patch('/me/change-password', {
      oldPassword,
      newPassword,
    })
    const { data } = response.data as BaseResponse<boolean>
    return data
  }

  static async updateInfo(user: User) {
    const response = await AxiosInstance.patch('/me/update-info', {
      fullName: user.fullName,
      phone: user.phone,
      birthday: user.birthday,
      gender: user.gender,
    })
    const { data } = response.data as BaseResponse<{ user: any }>

    return User.from(data.user)
  }
}
