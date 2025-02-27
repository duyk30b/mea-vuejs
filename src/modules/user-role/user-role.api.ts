import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { UserRole } from './user-role.model'

export class UserRoleApi {
  static async list(): Promise<UserRole[]> {
    const response = await AxiosInstance.get('/user-role/list')
    const { data } = response.data as BaseResponse
    return UserRole.fromList(data)
  }
}
