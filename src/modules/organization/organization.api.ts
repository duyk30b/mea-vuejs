import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Organization } from './organization.model'

export class OrganizationApi {
  static async info() {
    const response = await AxiosInstance.get('/organization/info')
    const { data } = response.data as BaseResponse

    return Organization.fromPlain(data)
  }

  static async updateInfo(plain: Partial<Organization>) {
    const dto = Organization.toPlain(plain, 'USER_UPDATE')
    const response = await AxiosInstance.patch('/organization/update-info', dto)
    const { data } = response.data as BaseResponse

    return Organization.fromPlain(data)
  }
}
