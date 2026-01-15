import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { FullResponse } from '../_base/base-dto'
import {
    RadiologySampleDetailQuery,
    RadiologySampleGetQuery,
    RadiologySampleListQuery,
    type RadiologySamplePaginationQuery,
} from './radiology-sample.dto'
import { RadiologySample } from './radiology-sample.model'

export class RadiologySampleApi {
  static async pagination(options: RadiologySamplePaginationQuery) {
    const params = RadiologySampleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/radiology-sample/pagination', { params })
    const { data } = response.data as FullResponse<{
      radiologySampleList: any[]
      total: number
      page: number
      limit: number
    }>
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      radiologySampleList: RadiologySample.fromList(data.radiologySampleList),
    }
  }

  static async list(options: RadiologySampleListQuery) {
    const params = RadiologySampleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/radiology-sample/list', { params })
    const { data, time } = response.data as FullResponse<{ radiologySampleList: any }>
    return RadiologySample.fromList(data.radiologySampleList)
  }

  static search: (params: RadiologySampleListQuery) => Promise<RadiologySample[]> = debounceAsync(
    async (params: RadiologySampleListQuery): Promise<RadiologySample[]> => {
      const response = await AxiosInstance.get('/radiology-sample/list', { params })
      const { data } = response.data as FullResponse<{ radiologySampleList: any }>
      return RadiologySample.fromList(data.radiologySampleList)
    },
    200,
  )

  static async detail(id: number, options: RadiologySampleDetailQuery): Promise<RadiologySample> {
    const params = RadiologySampleGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/radiology-sample/detail/${id}`, { params })
    const { data } = response.data as FullResponse<{ radiologySample: any }>
    return RadiologySample.from(data.radiologySample)
  }

  static async createOne(body: { radiologySample: RadiologySample }) {
    const { radiologySample } = body

    const response = await AxiosInstance.post('/radiology-sample/create', {
      name: radiologySample.name || '',
      priority: radiologySample.priority || 0,
      userId: radiologySample.userId || 0,
      radiologyId: radiologySample.radiologyId || 0,
      printHtmlId: radiologySample.printHtmlId || 0,
      description: radiologySample.description || '',
      result: radiologySample.result || '',
      customStyles: radiologySample.customStyles || '',
      customVariables: radiologySample.customVariables || '',
    })
    const { data } = response.data as FullResponse<{ radiologySample: any }>
    return RadiologySample.from(data.radiologySample)
  }

  static async updateOne(id: number, body: { radiologySample: RadiologySample }) {
    const { radiologySample } = body
    const response = await AxiosInstance.post(`/radiology-sample/update/${id}`, {
      name: radiologySample.name || '',
      priority: radiologySample.priority || 0,
      userId: radiologySample.userId || 0,
      radiologyId: radiologySample.radiologyId || 0,
      printHtmlId: radiologySample.printHtmlId || 0,
      description: radiologySample.description || '',
      result: radiologySample.result || '',
      customStyles: radiologySample.customStyles || '',
      customVariables: radiologySample.customVariables || '',
    })
    const { data } = response.data as FullResponse<{ radiologySample: any }>
    return RadiologySample.from(data.radiologySample)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/radiology-sample/destroy/${id}`)
    const result = response.data as FullResponse<any>

    return result
  }
}
