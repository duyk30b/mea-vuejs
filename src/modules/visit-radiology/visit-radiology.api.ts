import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { VisitRadiology } from './visit-radiology.model'

export class VisitRadiologyApi {
  static async createOne(options: { object: VisitRadiology; files: File[] }) {
    const { object, files } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('visitId', object.visitId.toString())
    formData.append('customerId', object.customerId.toString())
    formData.append('radiologyId', object.radiologyId.toString())
    formData.append('doctorId', object.doctorId.toString())
    formData.append('expectedPrice', object.expectedPrice.toString())
    formData.append('discountMoney', object.discountMoney.toString())
    formData.append('discountPercent', object.discountPercent.toString())
    formData.append('discountType', object.discountType)
    formData.append('actualPrice', object.actualPrice.toString())
    formData.append('description', object.description)
    formData.append('result', object.result)
    formData.append('startedAt', object.startedAt.toString())

    const response = await AxiosInstance.post(`/visit-radiology/create`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const { data } = response.data as BaseResponse<{ visitRadiologyId: number }>
    return data
  }

  static async updateOne(options: {
    id: number
    object: VisitRadiology
    imageIdsKeep: number[]
    files: File[]
    filesPosition: number[]
  }) {
    const { id, object, imageIdsKeep, files, filesPosition } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('filesPosition', JSON.stringify(filesPosition))
    formData.append('imageIdsKeep', JSON.stringify(imageIdsKeep))
    formData.append('doctorId', object.doctorId.toString())
    formData.append('description', object.description)
    formData.append('result', object.result)
    formData.append('startedAt', object.startedAt.toString())

    const response = await AxiosInstance.post(`/visit-radiology/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const { data } = response.data as BaseResponse<{ visitRadiologyId: number }>
    return data
  }
}
