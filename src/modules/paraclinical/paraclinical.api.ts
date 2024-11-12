import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import {
  ParaclinicalDetailQuery,
  ParaclinicalGetQuery,
  ParaclinicalListQuery,
  type ParaclinicalPaginationQuery,
} from './paraclinical.dto'
import { Paraclinical } from './paraclinical.model'

export class ParaclinicalApi {
  static async pagination(options: ParaclinicalPaginationQuery) {
    const params = ParaclinicalGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/paraclinical/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Paraclinical.fromList(data),
    }
  }

  static async list(options: ParaclinicalListQuery) {
    const params = ParaclinicalGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/paraclinical/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Paraclinical.fromList(data),
    }
  }

  static async exampleList() {
    const response = await AxiosInstance.get('/paraclinical/example-list')
    const { data, time } = response.data as BaseResponse
    return Paraclinical.fromList(data)
  }

  static search: (params: ParaclinicalListQuery) => Promise<Paraclinical[]> = debounceAsync(
    async (params: ParaclinicalListQuery): Promise<Paraclinical[]> => {
      const response = await AxiosInstance.get('/paraclinical/list', { params })
      const { data } = response.data as BaseResponse
      return Paraclinical.fromList(data)
    },
    200
  )

  static async detail(id: number, options: ParaclinicalDetailQuery): Promise<Paraclinical> {
    const params = ParaclinicalGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/paraclinical/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ paraclinical: any }>
    return Paraclinical.from(data.paraclinical)
  }

  static async createOne(paraclinical: Paraclinical) {
    const response = await AxiosInstance.post('/paraclinical/create', {
      name: paraclinical.name,
      paraclinicalGroupId: paraclinical.paraclinicalGroupId,
      price: paraclinical.price,
      attributeLayout: paraclinical.attributeLayout,
      conclusionDefault: paraclinical.conclusionDefault,
      paraclinicalAttributeList: (paraclinical.paraclinicalAttributeList || []).map((i) => {
        return {
          code: i.code,
          name: i.name,
          inputType: i.inputType,
          default: i.default,
          options: i.options,
        }
      }),
      printHtml: { content: paraclinical.printHtml?.content || '' },
    })
    const { data } = response.data as BaseResponse<{ paraclinical: any }>
    return Paraclinical.from(data.paraclinical)
  }

  static async updateOne(id: number, paraclinical: Paraclinical) {
    const response = await AxiosInstance.patch(`/paraclinical/update/${id}`, {
      name: paraclinical.name,
      paraclinicalGroupId: paraclinical.paraclinicalGroupId,
      price: paraclinical.price,
      attributeLayout: paraclinical.attributeLayout,
      conclusionDefault: paraclinical.conclusionDefault || '',
      paraclinicalAttributeList: (paraclinical.paraclinicalAttributeList || []).map((i) => {
        return {
          code: i.code,
          name: i.name,
          inputType: i.inputType,
          default: i.default,
          options: i.options,
        }
      }),
      printHtml: { content: paraclinical.printHtml?.content || '' },
    })
    const { data } = response.data as BaseResponse<{ paraclinical: any }>
    return Paraclinical.from(data.paraclinical)
  }

  static async updateInfo(id: number, paraclinical: Paraclinical) {
    const response = await AxiosInstance.patch(`/paraclinical/update-info/${id}`, {
      name: paraclinical.name,
      paraclinicalGroupId: paraclinical.paraclinicalGroupId,
      price: paraclinical.price,
      conclusionDefault: paraclinical.conclusionDefault,
    })
    const { data } = response.data as BaseResponse<{ paraclinical: any }>
    return Paraclinical.from(data.paraclinical)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/paraclinical/delete/${id}`)
    const { data } = response.data as BaseResponse<{ paraclinical: any }>
    return Paraclinical.from(data.paraclinical)
  }
}
