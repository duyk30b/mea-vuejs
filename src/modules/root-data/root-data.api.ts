import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'

export class RootDataApi {
  static async migration(body: { key: string }) {
    const response = await AxiosInstance.post('/root/data/migration', body)
    const { data } = response.data as BaseResponse<boolean>

    return data
  }
}
