import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Organization } from '../organization'
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
      data: Organization.fromList(data),
    }
  }

  static async createOne(organization: Organization) {
    const response = await AxiosInstance.post('/root/organization/create', {
      phone: organization.phone,
      email: organization.email,
      emailVerify: organization.emailVerify,
      name: organization.name,
      facebook: organization.facebook || '',
      level: organization.level,
      dataVersion: organization.dataVersion,
      addressProvince: organization.addressProvince || '',
      addressWard: organization.addressWard || '',
      addressStreet: organization.addressStreet || '',
      permissionIds: organization.permissionIds,
      status: organization.status,
      note: organization.note || '',
      expiryDate: organization.expiryDate,
    })
    const { data } = response.data as BaseResponse<{ organization: any }>

    return Organization.from(data.organization)
  }

  static async updateOne(id: number, organization: Organization) {
    const response = await AxiosInstance.patch(`/root/organization/update/${id}`, {
      phone: organization.phone,
      facebook: organization.facebook,
      email: organization.email,
      emailVerify: organization.emailVerify,
      level: organization.level,
      name: organization.name,
      dataVersion: organization.dataVersion,
      addressProvince: organization.addressProvince || '',
      addressWard: organization.addressWard || '',
      addressStreet: organization.addressStreet || '',
      permissionIds: organization.permissionIds,
      status: organization.status,
      note: organization.note,
      expiryDate: organization.expiryDate,
    })
    const { data } = response.data as BaseResponse<{ organization: any }>

    return Organization.from(data.organization)
  }

  static async clearOne(
    oid: number,
    body: { tableNameDeleteList: string[]; tableNameClearList: string[] },
  ) {
    const response = await AxiosInstance.put(`/root/organization/clear/${oid}`, body)
    const { data } = response.data as BaseResponse

    return data
  }
}
