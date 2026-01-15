import { AxiosInstance } from '../../../core/axios.instance'
import type { FullResponse } from '../../_base/base-dto'

export class RootDataApi {
  static async migration(body: { key: string }) {
    const response = await AxiosInstance.post('/root/data/migration', body)
    const { data } = response.data as FullResponse<boolean>

    return data
  }

  static async uploadPostgresToGoogleDriver() {
    const response = await AxiosInstance.post('/cron-job/job-backup-postgres')
    const { data } = response.data as FullResponse<any>

    return data
  }
}
