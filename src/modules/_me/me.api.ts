import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Organization } from '../organization'
import { Permission } from '../permission/permission.model'
import { User } from '../user/user.model'

export class MeApi {
  static async data() {
    const response = await AxiosInstance.get('/me/data')
    const { data } = response.data as BaseResponse
    return {
      organization: Organization.from(data.organization),
      permissionAll: Permission.fromList(data.permissionAll),
      roomIdList: data.roomIdList as number[],
      permissionIds: data.permissionIds,
      settingMap: data.settingMap as Record<string, any>,
      settingMapRoot: data.settingMapRoot as Record<string, any>,
      user: User.from(data.user),
    }
  }

  static async info() {
    const response = await AxiosInstance.get('/me/info')
    const { data } = response.data as BaseResponse<{ user: any }>
    return User.from(data.user)
  }

  static async changePassword(oldPassword: string, newPassword: string) {
    const response = await AxiosInstance.patch('/me/change-password', {
      oldPassword,
      newPassword,
    })
    const { data } = response.data as BaseResponse<boolean>
    return data
  }

  static async updateInfo(options: {
    files: File[]
    userInfo: { fullName: string; phone?: string; birthday?: number; gender?: number }
    imagesChange?: {
      imageIdsKeep: number[]
      filesPosition: number[]
    }
  }) {
    const { files, userInfo, imagesChange } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('userInfo', JSON.stringify(userInfo))

    if (imagesChange) {
      formData.append('imagesChange', JSON.stringify(imagesChange))
    }

    const response = await AxiosInstance.post('/me/update-info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const { data } = response.data as BaseResponse<{ user: any }>

    return User.from(data.user)
  }
}
