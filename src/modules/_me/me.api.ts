import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { Organization } from '../organization'
import { Permission } from '../permission/permission.model'
import { User } from '../user/user.model'

export class MeApi {
  static async data() {
    const response = await AxiosInstance.get('/me/data')
    const { data } = response.data as FullResponse
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
    const { data } = response.data as FullResponse<{ user: any }>
    return User.from(data.user)
  }

  static async changePassword(oldPassword: string, newPassword: string) {
    const response = await AxiosInstance.post('/me/change-password', {
      oldPassword,
      newPassword,
    })
    const { data } = response.data as FullResponse<boolean>
    return data
  }

  static async updateInfo(options: {
    userInfo: { fullName: string; phone?: string; birthday?: number; gender?: number }
    imagesChange?: {
      files: File[]
      imageIdWaitList: number[]
      externalUrlList: string[]
    }
  }) {
    const { userInfo, imagesChange } = options

    const formData = new FormData()
    formData.append('userInfo', JSON.stringify(userInfo))

    if (imagesChange) {
      // imagesChange.files.forEach((file) => formData.append('files', file))
      const imagesChangeStr = JSON.stringify({
        imageIdWaitList: imagesChange.imageIdWaitList,
        externalUrlList: imagesChange.externalUrlList,
      })
      formData.append('imagesChange', imagesChangeStr)
    }

    const response = await AxiosInstance.post('/me/update-info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const { data } = response.data as FullResponse<{ user: any }>

    return User.from(data.user)
  }
}
