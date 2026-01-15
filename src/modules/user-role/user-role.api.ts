import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { UserRole } from './user-role.model'

export class UserRoleApi {
  static async list(): Promise<UserRole[]> {
    const response = await AxiosInstance.get('/user-role/list')
    const { data } = response.data as FullResponse
    return UserRole.fromList(data)
  }
}
