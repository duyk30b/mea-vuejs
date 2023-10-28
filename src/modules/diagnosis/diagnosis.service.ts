import { AxiosInstance } from '../../core/axios.instance'
import { Diagnosis } from './diagnosis.model'

export class DiagnosisService {
  static async createOne(medicalRecord: Diagnosis) {
    const medicalRecordDto = Diagnosis.toPlain(medicalRecord)
    const { data } = await AxiosInstance.post('/diagnosis/create', medicalRecordDto)

    return Diagnosis.fromPlain(data)
  }

  static async updateOne(id: number, medicalRecord: Diagnosis) {
    const medicalRecordDto = Diagnosis.toPlain(medicalRecord)
    delete medicalRecordDto.arrival_id
    const response = await AxiosInstance.patch(`/diagnosis/update/${id}`, medicalRecordDto)

    return Diagnosis.fromPlain(response.data)
  }
}
