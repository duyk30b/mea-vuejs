import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import { USER_CREATE, USER_UPDATE } from '../_base/base-expose'
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
      data: Radiology.fromPlains(data),
    }
  }

  static async list(options: RadiologyListQuery) {
    const params = RadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/radiology/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Radiology.fromPlains(data),
    }
  }

  static search: (params: RadiologyListQuery) => Promise<Radiology[]> = debounceAsync(
    async (params: RadiologyListQuery): Promise<Radiology[]> => {
      const response = await AxiosInstance.get('/radiology/list', { params })
      const { data } = response.data as BaseResponse
      return Radiology.fromPlains(data)
    },
    200
  )

  static async detail(id: number, options: RadiologyDetailQuery): Promise<Radiology> {
    const params = RadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/radiology/detail/${id}`, { params })
    const { data } = response.data as BaseResponse
    return Radiology.fromPlain(data)
  }

  static async createOne(instance: Radiology) {
    const plain = Radiology.toPlain(instance, USER_CREATE)
    const response = await AxiosInstance.post('/radiology/create', plain)
    const { data } = response.data as BaseResponse
    return Radiology.fromPlain(data)
  }

  static async updateOne(id: number, instance: Radiology) {
    const plain = Radiology.toPlain(instance, USER_UPDATE)
    const response = await AxiosInstance.patch(`/radiology/update/${id}`, plain)
    const { data } = response.data as BaseResponse
    return Radiology.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/radiology/delete/${id}`)
    const { data } = response.data as BaseResponse
    return Radiology.fromPlain(data)
  }
}
