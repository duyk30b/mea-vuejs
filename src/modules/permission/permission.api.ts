import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { PermissionGetQuery, PermissionListQuery } from './permission.dto'
import { Permission } from './permission.model'

export class PermissionApi {
  static async list(options: PermissionListQuery): Promise<Permission[]> {
    const params = PermissionGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/permission/list', { params })
    const { data } = response.data as BaseResponse
    return Permission.fromPlains(data)
  }

  static async initData() {
    const response = await AxiosInstance.post('/permission/init-data')
    const { data } = response.data as BaseResponse<{ idsEffect: number[] }>
    return data
  }
}
