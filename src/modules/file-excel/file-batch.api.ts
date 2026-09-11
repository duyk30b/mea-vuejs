import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { FullResponse } from '../_base/base-dto'
import { BatchGetQuery, type BatchListQuery } from '../batch'

export class FileBatchApi {
  static async downloadExcel(options: BatchListQuery) {
    const params = BatchGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/file-batch/download-excel`, { params })
    const { data } = response.data as FullResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }
}
