import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Organization } from '../organization'
import { Permission } from '../permission/permission.model'
import { User } from '../user/user.model'

export class MeApi {
  static async info() {
    const response = await AxiosInstance.get('/me/info')
    const { data } = response.data as BaseResponse
    return {
      organization: Organization.from(data.organization),
      permissionAll: Permission.fromList(data.permissionAll),
      permissionIds: data.permissionIds,
      settingMap: data.settingMap as Record<string, any>,
      settingMapRoot: data.settingMapRoot as Record<string, any>,
      user: User.from(data.user),
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
