import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { FullResponse } from '../_base/base-dto'
import { PaymentGetParams, type PaymentListQuery } from '../payment/payment.dto'

export class FilePaymentApi {
  static async downloadExcel(options: PaymentListQuery) {
    const params = PaymentGetParams.toQuery(options)
    const response = await AxiosInstance.get(`/file-payment/download-excel`, { params })
    const { data } = response.data as FullResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }
}
