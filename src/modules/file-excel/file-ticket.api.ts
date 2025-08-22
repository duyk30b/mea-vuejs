import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { BaseResponse } from '../_base/base-dto'
import { TicketGetQuery, TicketListQuery } from '../ticket'

export class FileTicketApi {
  static async downloadExcelTicketList(options: TicketListQuery) {
    const params = TicketGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/file-ticket/download-excel`, {
      params,
    })
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }
}
