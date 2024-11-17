import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import {
  LaboratoryDetailQuery,
  LaboratoryGetQuery,
  LaboratoryListQuery,
  type LaboratoryPaginationQuery,
} from './laboratory.dto'
import { Laboratory } from './laboratory.model'

export class LaboratoryApi {
  static async pagination(options: LaboratoryPaginationQuery) {
    const params = LaboratoryGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/laboratory/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Laboratory.fromList(data),
    }
  }

  static async list(options: LaboratoryListQuery) {
    const params = LaboratoryGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/laboratory/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Laboratory.fromList(data),
    }
  }

  static async exampleList() {
    const response = await AxiosInstance.get('/laboratory/example-list')
    const { data, time } = response.data as BaseResponse
    return Laboratory.fromList(data)
  }

  static search: (params: LaboratoryListQuery) => Promise<Laboratory[]> = debounceAsync(
    async (params: LaboratoryListQuery): Promise<Laboratory[]> => {
      const response = await AxiosInstance.get('/laboratory/list', { params })
      const { data } = response.data as BaseResponse
      return Laboratory.fromList(data)
    },
    200
  )

  static async detail(id: number, options: LaboratoryDetailQuery): Promise<Laboratory> {
    const params = LaboratoryGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/laboratory/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ laboratory: any }>
    return Laboratory.from(data.laboratory)
  }

  static async createOne(laboratory: Laboratory) {
    const response = await AxiosInstance.post('/laboratory/create', {
      name: laboratory.name,
      laboratoryGroupId: laboratory.laboratoryGroupId,
      printHtmlId: laboratory.printHtmlId,
      price: laboratory.price,
      descriptionDefault: laboratory.descriptionDefault,
      resultDefault: laboratory.resultDefault,
    })
    const { data } = response.data as BaseResponse<{ laboratory: any }>
    return Laboratory.from(data.laboratory)
  }

  static async updateOne(id: number, laboratory: Laboratory) {
    const response = await AxiosInstance.patch(`/laboratory/update/${id}`, {
      name: laboratory.name,
      laboratoryGroupId: laboratory.laboratoryGroupId,
      printHtmlId: laboratory.printHtmlId,
      price: laboratory.price,
      descriptionDefault: laboratory.descriptionDefault,
      resultDefault: laboratory.resultDefault,
    })
    const { data } = response.data as BaseResponse<{ laboratory: any }>
    return Laboratory.from(data.laboratory)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/laboratory/delete/${id}`)
    const { data } = response.data as BaseResponse<{ laboratory: any }>
    return Laboratory.from(data.laboratory)
  }
}
