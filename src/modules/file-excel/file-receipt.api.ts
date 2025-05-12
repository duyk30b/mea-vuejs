import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { BaseResponse } from '../_base/base-dto'

export class FileReceiptApi {
  static async downloadFileUploadExcelExample() {
    const response = await AxiosInstance.get(`/file-receipt/upload-excel/file-example`)
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }

  static async uploadExcelForCreateDraft(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await AxiosInstance.post(
      `/file-receipt/upload-excel-for-create-draft`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            console.log(`Đã upload: ${percentCompleted}%`)
          }
        },
      },
    )
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }
}
