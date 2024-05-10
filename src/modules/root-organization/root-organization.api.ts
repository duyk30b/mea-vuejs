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
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Organization.fromPlains(data),
    }
  }

  static async createOne(instance: Organization) {
    const plain = Organization.toPlain(instance, 'ROOT_CREATE')

    const response = await AxiosInstance.post('/root/organization/create', plain)
    const { data } = response.data as BaseResponse

    return Organization.fromPlain(data)
  }

  static async updateOne(id: number, instance: Organization) {
    const plain = Organization.toPlain(instance, 'ROOT_UPDATE')

    const response = await AxiosInstance.patch(`/root/organization/update/${id}`, plain)
    const { data } = response.data as BaseResponse

    return Organization.fromPlain(data)
  }

  static async clearOne(id: number) {
    const response = await AxiosInstance.put(`/root/organization/clear/${id}`)
    const { data } = response.data as BaseResponse

    return data
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/root/organization/delete/${id}`)
    const { data } = response.data as BaseResponse

    return data
  }
}
