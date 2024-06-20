import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { VisitDiagnosis } from './visit-diagnosis.model'

export class VisitDiagnosisApi {
  static async createOne(instance: VisitDiagnosis) {
    const plain = VisitDiagnosis.toPlain(instance, 'USER_CREATE')
    const response = await AxiosInstance.post('/visit-diagnosis/create', plain)
    const { data } = response.data as BaseResponse
    return VisitDiagnosis.fromPlain(data)
  }

  static async updateOne(id: number, instance: VisitDiagnosis) {
    const plain = VisitDiagnosis.toPlain(instance, 'USER_UPDATE')
    const response = await AxiosInstance.patch(`/visit-diagnosis/update/${id}`, plain)
    const { data } = response.data as BaseResponse
    return VisitDiagnosis.fromPlain(data)
  }
}
