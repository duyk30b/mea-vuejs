import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import { TicketLaboratory } from '../ticket-laboratory'
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

  static async create(laboratory: Laboratory) {
    const response = await AxiosInstance.post('/laboratory/create', {
      priority: laboratory.priority,
      name: laboratory.name,
      laboratoryGroupId: laboratory.laboratoryGroupId,
      price: laboratory.price,
      valueType: laboratory.valueType,
      lowValue: laboratory.lowValue,
      highValue: laboratory.highValue,
      unit: laboratory.unit,
      options: laboratory.options,
      children: (laboratory.children || []).map((i) => {
        return {
          name: i.name,
          priority: i.priority,
          price: i.price,
          lowValue: i.lowValue,
          highValue: i.highValue,
          valueType: i.valueType,
          unit: i.unit,
          options: i.options,
        }
      }),
    })
    const { data } = response.data as BaseResponse<{ laboratory: any }>
    return Laboratory.from(data.laboratory)
  }

  static async update(id: number, laboratory: Laboratory) {
    const response = await AxiosInstance.patch(`/laboratory/update/${id}`, {
      priority: laboratory.priority,
      name: laboratory.name,
      price: laboratory.price,
      laboratoryGroupId: laboratory.laboratoryGroupId,
      lowValue: laboratory.lowValue,
      highValue: laboratory.highValue,
      valueType: laboratory.valueType, // không cho cập nhật loại giá trị
      unit: laboratory.unit,
      options: laboratory.options,
      children: (laboratory.children || []).map((i) => {
        return {
          id: i.id,
          priority: i.priority,
          name: i.name,
          price: i.price,
          lowValue: i.lowValue,
          highValue: i.highValue,
          valueType: i.valueType,
          unit: i.unit,
          options: i.options,
        }
      }),
    })
    const { data } = response.data as BaseResponse<{ laboratory: any }>
    return Laboratory.from(data.laboratory)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/laboratory/destroy/${id}`)
    const result = response.data as BaseResponse<{
      laboratoryId: number
      ticketLaboratoryList: TicketLaboratory[]
    }>
    result.data.ticketLaboratoryList = TicketLaboratory.fromList(result.data.ticketLaboratoryList)
    return result
  }

  static async systemList() {
    const response = await AxiosInstance.get('/laboratory/system-list')
    const { data, time } = response.data as BaseResponse
    return Laboratory.fromList(data)
  }

  static async systemCopy(body: { laboratoryIdList: number[] }) {
    const response = await AxiosInstance.post('/laboratory/system-copy', {
      laboratoryIdList: body.laboratoryIdList,
    })
    const { data, time } = response.data as BaseResponse<boolean>
    return data
  }
}
