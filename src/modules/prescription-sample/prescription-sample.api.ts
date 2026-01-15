import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { PrescriptionSampleItem } from './prescription-sample-item.model'
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
    const { data, meta } = response.data as FullResponse
    return {
      prescriptionSampleList: PrescriptionSample.fromList(data.prescriptionSampleList),
      total: data.total,
      page: data.page,
      limit: data.limit,
    }
  }

  static async list(options: PrescriptionSampleListQuery) {
    const params = PrescriptionSampleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/prescription-sample/list', { params })
    const { data, time } = response.data as FullResponse<{ prescriptionSampleList: any[] }>
    return PrescriptionSample.fromList(data.prescriptionSampleList)
  }

  static async detail(
    id: string,
    options: PrescriptionSampleDetailQuery = {},
  ): Promise<PrescriptionSample> {
    const params = PrescriptionSampleGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/prescription-sample/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse<{ prescriptionSample: any }>
    return PrescriptionSample.from(data.prescriptionSample)
  }

  static async createOne(body: {
    prescriptionSampleBody: PrescriptionSample
    prescriptionSampleItemBodyList: PrescriptionSampleItem[]
  }) {
    const { prescriptionSampleBody, prescriptionSampleItemBodyList } = body
    const response = await AxiosInstance.post('/prescription-sample/create', {
      prescriptionSampleBody: {
        priority: prescriptionSampleBody.priority,
        userId: prescriptionSampleBody.userId,
        name: prescriptionSampleBody.name,
      },
      prescriptionSampleItemBodyList: prescriptionSampleItemBodyList.map((i) => {
        return {
          priority: i.priority,
          productId: i.productId,
          unitQuantity: i.unitQuantity,
          unitRate: i.unitRate,
          hintUsage: i.hintUsage || '',
        }
      }),
    })
    const { data } = response.data as FullResponse<{ prescriptionSampleCreated: any }>
    return PrescriptionSample.from(data.prescriptionSampleCreated)
  }

  static async updateOne(
    id: string,
    body: {
      prescriptionSampleBody?: PrescriptionSample
      prescriptionSampleItemBodyList?: PrescriptionSampleItem[]
    },
  ) {
    const { prescriptionSampleBody, prescriptionSampleItemBodyList } = body
    const response = await AxiosInstance.post(`/prescription-sample/update/${id}`, {
      prescriptionSampleBody: prescriptionSampleBody
        ? {
          priority: prescriptionSampleBody.priority,
          userId: prescriptionSampleBody.userId,
          name: prescriptionSampleBody.name,
        }
        : undefined,
      prescriptionSampleItemBodyList: prescriptionSampleItemBodyList
        ? prescriptionSampleItemBodyList.map((i) => {
          return {
            priority: i.priority,
            productId: i.productId,
            unitQuantity: i.unitQuantity,
            unitRate: i.unitRate,
            hintUsage: i.hintUsage || '',
          }
        })
        : undefined,
    })
    const { data } = response.data as FullResponse<{
      prescriptionSampleModified?: any
      prescriptionSampleItemList?: any[]
    }>
    return {
      prescriptionSampleModified: data.prescriptionSampleModified
        ? PrescriptionSample.from(data.prescriptionSampleModified)
        : undefined,
      prescriptionSampleItemList: data.prescriptionSampleItemList
        ? PrescriptionSampleItem.fromList(data.prescriptionSampleItemList)
        : undefined,
    }
  }

  static async destroyOne(id: string) {
    const response = await AxiosInstance.post(`/prescription-sample/destroy/${id}`)
    const { data, meta } = response.data as FullResponse<boolean>
    return data
  }
}
