import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { FullResponse } from '../_base/base-dto'

export class FileStatisticApi {
  static async downloadExcelWarehouseStatistic() {
    const response = await AxiosInstance.get(`/file-statistic/download-excel-warehouse-statistic`)
    const { data } = response.data as FullResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }
}
