import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  PrescriptionSampleDetailQuery,
  PrescriptionSampleGetQuery,
  type PrescriptionSampleListQuery,
  type PrescriptionSamplePaginationQuery,
} from './prescription-sample.dto'
import { PrescriptionSample } from './prescription-sample.model'

export class PrescriptionSampleApi {
  static async pagination(options: PrescriptionSamplePaginationQuery) {
    const params = PrescriptionSampleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/prescription-sample/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: PrescriptionSample.fromList(data),
    }
  }

  static async list(options: PrescriptionSampleListQuery) {
    const params = PrescriptionSampleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/prescription-sample/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: PrescriptionSample.fromList(data),
    }
  }

  static async detail(
    id: number,
    options: PrescriptionSampleDetailQuery = {}
  ): Promise<PrescriptionSample> {
    const params = PrescriptionSampleGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/prescription-sample/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ prescriptionSample: any }>
    return PrescriptionSample.from(data.prescriptionSample)
  }

  static async createOne(prescriptionSample: PrescriptionSample) {
    const response = await AxiosInstance.post('/prescription-sample/create', {
      priority: prescriptionSample.priority,
      userId: prescriptionSample.userId,
      name: prescriptionSample.name,
      medicines: prescriptionSample.medicines,
    })
    const { data } = response.data as BaseResponse<{ prescriptionSample: any }>
    return PrescriptionSample.from(data.prescriptionSample)
  }

  static async updateOne(id: number, ins: Partial<PrescriptionSample>) {
    const response = await AxiosInstance.post(`/prescription-sample/update/${id}`, {
      priority: ins.priority,
      userId: ins.userId,
      name: ins.name,
      medicines: ins.medicines,
    })
    const { data } = response.data as BaseResponse<{ prescriptionSample: any }>
    return PrescriptionSample.from(data.prescriptionSample)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/prescription-sample/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse<boolean>
    return data
  }
}
