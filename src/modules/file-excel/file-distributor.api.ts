import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { FullResponse } from '../_base/base-dto'
import { DistributorGetQuery, type DistributorListQuery } from '../distributor/distributor.dto'

export class FileDistributorApi {
  static async downloadExcel(options: DistributorListQuery) {
    const params = DistributorGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/file-distributor/download-excel`, { params })
    const { data } = response.data as FullResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }
}
