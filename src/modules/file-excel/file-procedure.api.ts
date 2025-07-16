import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { BaseResponse } from '../_base/base-dto'

export class FileProcedureApi {
  static async downloadExcel() {
    const response = await AxiosInstance.get(`/file-procedure/download-excel`)
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }

  static async downloadExcelFileExample() {
    const response = await AxiosInstance.get(`/file-procedure/download-excel/file-example`)
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }

  static async uploadExcelProcedureList(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await AxiosInstance.post(`/file-procedure/upload-excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Đã upload: ${percentCompleted}%`)
        }
      },
    })
    const { data } = response.data as BaseResponse<boolean>
    return data
  }
}
