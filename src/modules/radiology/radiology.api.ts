import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import {
  RadiologyDetailQuery,
  RadiologyGetQuery,
  RadiologyListQuery,
  type RadiologyPaginationQuery,
} from './radiology.dto'
import { Radiology } from './radiology.model'

export class RadiologyApi {
  static async pagination(options: RadiologyPaginationQuery) {
    const params = RadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/radiology/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Radiology.fromList(data),
    }
  }

  static async list(options: RadiologyListQuery) {
    const params = RadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/radiology/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Radiology.fromList(data),
    }
  }

  static async exampleList() {
    const response = await AxiosInstance.get('/radiology/example-list')
    const { data, time } = response.data as BaseResponse
    return Radiology.fromList(data)
  }

  static search: (params: RadiologyListQuery) => Promise<Radiology[]> = debounceAsync(
    async (params: RadiologyListQuery): Promise<Radiology[]> => {
      const response = await AxiosInstance.get('/radiology/list', { params })
      const { data } = response.data as BaseResponse
      return Radiology.fromList(data)
    },
    200
  )

  static async detail(id: number, options: RadiologyDetailQuery): Promise<Radiology> {
    const params = RadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/radiology/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ radiology: any }>
    return Radiology.from(data.radiology)
  }

  static async createOne(radiology: Radiology) {
    const response = await AxiosInstance.post('/radiology/create', {
      name: radiology.name,
      group: radiology.group,
      price: radiology.price,
      descriptionDefault: radiology.descriptionDefault,
      resultDefault: radiology.resultDefault,
    })
    const { data } = response.data as BaseResponse<{ radiology: any }>
    return Radiology.from(data.radiology)
  }

  static async updateOne(id: number, radiology: Radiology) {
    const response = await AxiosInstance.patch(`/radiology/update/${id}`, {
      name: radiology.name,
      group: radiology.group,
      price: radiology.price,
      descriptionDefault: radiology.descriptionDefault,
      resultDefault: radiology.resultDefault,
    })
    const { data } = response.data as BaseResponse<{ radiology: any }>
    return Radiology.from(data.radiology)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/radiology/delete/${id}`)
    const { data } = response.data as BaseResponse<{ radiology: any }>
    return Radiology.from(data.radiology)
  }
}
