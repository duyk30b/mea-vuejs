import { SystemLog, SystemLogGetQuery, type SystemLogPaginationQuery } from '@/modules/system-log'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'

export class RootSystemLogApi {
  static async pagination(options: SystemLogPaginationQuery) {
    const params = SystemLogGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/root/system-log/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      page: data.page,
      limit: data.limit,
      total: data.total,
      systemLogList: SystemLog.fromList(data.systemLogList),
    }
  }
}
