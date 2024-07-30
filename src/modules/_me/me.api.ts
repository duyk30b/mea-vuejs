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
      user: User.fromPlain(data.user),
      organization: Organization.fromPlain(data.organization),
      role: Role.fromPlain(data.role),
      settingMap: data.settingMap as Record<string, any>,
      permissionList: Permission.fromPlains(data.permissionList),
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
    const userDto = User.toPlain(user, 'USER_UPDATE')

    const response = await AxiosInstance.patch('/me/update-info', userDto)
    const { data } = response.data as BaseResponse

    return User.fromPlain(data)
  }
}
