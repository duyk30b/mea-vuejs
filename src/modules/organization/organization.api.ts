import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Organization } from './organization.model'

export class OrganizationApi {
  static async info() {
    const response = await AxiosInstance.get('/organization/info')
    const { data } = response.data as BaseResponse<{ organization: any }>

    return Organization.from(data.organization)
  }

  static async updateInfo(options: {
    organizationInfo: Organization
    imagesChange?: {
      files: File[]
      imageIdWaitList: number[]
      externalUrlList: string[]
    }
  }) {
    const { organizationInfo, imagesChange } = options

    const formData = new FormData()
    const organizationInfoStr = JSON.stringify({
      name: organizationInfo.name,
      addressProvince: organizationInfo.addressProvince || '',
      addressWard: organizationInfo.addressWard || '',
      addressStreet: organizationInfo.addressStreet || '',
    })
    formData.append('organizationInfo', organizationInfoStr)

    if (imagesChange) {
      // imagesChange.files.forEach((file) => formData.append('files', file))
      const imagesChangeStr = JSON.stringify({
        imageIdWaitList: imagesChange.imageIdWaitList,
        externalUrlList: imagesChange.externalUrlList,
      })
      formData.append('imagesChange', imagesChangeStr)
    }

    const response = await AxiosInstance.patch('/organization/update-info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const { data } = response.data as BaseResponse<{ organization: any }>

    return Organization.from(data.organization)
  }

  static async sendEmailVerifyOrganizationEmail() {
    const response = await AxiosInstance.post('/organization/send-email-verify-organization-email')
    const { data } = response.data as BaseResponse

    return data
  }

  static async changeEmail(email: string) {
    const response = await AxiosInstance.patch('/organization/change-email', {
      email,
    })
    const { data } = response.data as BaseResponse<{ organization: any }>

    return Organization.from(data.organization)
  }
}
