import { AxiosInstance } from '../../core/axios.instance'
import { ESDom } from '../../utils'
import type { BaseResponse } from '../_base/base-dto'

export class FileProductApi {
  static async downloadExcelProductList() {
    const response = await AxiosInstance.get(`/file-product/download-excel`)
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }

  static async uploadExcelProductList(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await AxiosInstance.post(`/file-product/upload-excel`, formData, {
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

  static async downloadFileUploadExcelExample() {
    const response = await AxiosInstance.get(`/file-product/upload-excel/file-example`)
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    ESDom.downloadFile(data)
  }
}
