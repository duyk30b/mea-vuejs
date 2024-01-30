import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Organization } from '../organization'
import type { ApiPaginationResponse } from '../pagination'
import {
  RootOrganizationGetQuery,
  type RootOrganizationPaginationQuery,
} from './root-organization.dto'

export class RootOrganizationApi {
  static async pagination(options: RootOrganizationPaginationQuery) {
    const params = RootOrganizationGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/root/organization/pagination', { params })
    const responseData = response.data as BaseResponse<ApiPaginationResponse>
    return {
      total: responseData.data.total,
      page: responseData.data.page,
      limit: responseData.data.limit,
      data: Organization.fromPlains(responseData.data.data),
    }
  }

  static async createOne(instance: Organization) {
    const plain = Organization.toPlain(instance, 'ROOT_CREATE')

    const response = await AxiosInstance.post('/root/organization/create', plain)
    const responseData = response.data as BaseResponse

    return Organization.fromPlain(responseData.data)
  }

  static async updateOne(id: number, instance: Organization) {
    const plain = Organization.toPlain(instance, 'ROOT_UPDATE')

    const response = await AxiosInstance.patch(`/root/organization/update/${id}`, plain)
    const responseData = response.data as BaseResponse

    return Organization.fromPlain(responseData.data)
  }
}
