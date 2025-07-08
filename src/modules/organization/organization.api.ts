import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Organization } from './organization.model'

export class OrganizationApi {
  static async info() {
    const response = await AxiosInstance.get('/organization/info')
    const { data } = response.data as BaseResponse<{ organization: any }>

    return Organization.from(data.organization)
  }

  static async updateInfo(organization: Organization) {
    const response = await AxiosInstance.patch('/organization/update-info', {
      name: organization.name,
      addressProvince: organization.addressProvince,
      addressWard: organization.addressWard,
      addressStreet: organization.addressStreet,
    })
    const { data } = response.data as BaseResponse<{ organization: any }>

    return Organization.from(data.organization)
  }

  static async updateInfoAndLogo(organization: Organization, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', organization.name)
    formData.append('addressProvince', organization.addressProvince)
    formData.append('addressWard', organization.addressWard)
    formData.append('addressStreet', organization.addressStreet)

    const response = await AxiosInstance.patch(`/organization/update-info-and-logo`, formData, {
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
