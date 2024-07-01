import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { VisitDiagnosis } from './visit-diagnosis.model'

export class VisitDiagnosisApi {
  static async updateOne(options: {
    id: number
    object: {
      customerId: number
      reason: string
      healthHistory: string
      summary: string
      diagnosis: string
      vitalSigns: string
    }
    imageIdsKeep: number[]
    files: File[]
    filesPosition: number[]
  }) {
    const { id, object, imageIdsKeep, files, filesPosition } = options
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('filesPosition', JSON.stringify(filesPosition))
    formData.append('imageIdsKeep', JSON.stringify(imageIdsKeep))
    formData.append('customerId', object.customerId.toString())
    formData.append('reason', object.reason)
    formData.append('healthHistory', object.healthHistory)
    formData.append('summary', object.summary)
    formData.append('diagnosis', object.diagnosis)
    formData.append('vitalSigns', object.vitalSigns)

    const response = await AxiosInstance.post(`/visit-diagnosis/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const { data } = response.data as BaseResponse
  }
}
