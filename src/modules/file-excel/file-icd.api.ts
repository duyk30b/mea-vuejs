import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'

export class FileICDApi {
  static async uploadExcelICDList(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await AxiosInstance.post(`/file-icd/upload-excel`, formData, {
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
    const { data } = response.data as FullResponse<boolean>
    return data
  }
}
