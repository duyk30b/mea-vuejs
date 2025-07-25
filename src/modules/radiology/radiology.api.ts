import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import { TicketRadiology } from '../ticket-radiology'
import {
  RadiologyDetailQuery,
  RadiologyGetQuery,
  RadiologyListQuery,
  type RadiologyPaginationQuery,
} from './radiology.dto'
import { Radiology } from './radiology.model'
import type { Discount } from '../discount'
import type { Position } from '../position'

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
    return Radiology.fromList(data)
  }

  static search: (params: RadiologyListQuery) => Promise<Radiology[]> = debounceAsync(
    async (params: RadiologyListQuery): Promise<Radiology[]> => {
      const response = await AxiosInstance.get('/radiology/list', { params })
      const { data } = response.data as BaseResponse
      return Radiology.fromList(data)
    },
    200,
  )

  static async detail(id: number, options: RadiologyDetailQuery): Promise<Radiology> {
    const params = RadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/radiology/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ radiology: any }>
    return Radiology.from(data.radiology)
  }

  static async createOne(body: {
    radiology: Radiology
    positionList?: Position[]
    discountList?: Discount[]
  }) {
    const { radiology, discountList, positionList } = body

    const response = await AxiosInstance.post('/radiology/create', {
      radiology: {
        radiologyCode: radiology.radiologyCode,
        name: radiology.name,
        radiologyGroupId: radiology.radiologyGroupId,
        printHtmlId: radiology.printHtmlId,
        costPrice: radiology.costPrice,
        price: radiology.price,
        requestNoteDefault: radiology.requestNoteDefault,
        descriptionDefault: radiology.descriptionDefault,
        resultDefault: radiology.resultDefault,
        customVariables: radiology.customVariables,
        customStyles: radiology.customStyles,
      },
      positionList: positionList
        ?.filter((i) => !!i.roleId)
        .map((i) => {
          return {
            roleId: i.roleId,
            commissionValue: i.commissionValue,
            commissionCalculatorType: i.commissionCalculatorType,
          }
        }),
      discountList: discountList?.map((i) => {
        return {
          priority: i.priority,
          isActive: i.isActive,
          // discountInteractType: i.discountInteractType,
          // discountInteractId: i.discountInteractId,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          discountRepeatType: i.discountRepeatType,
          periodsDay: i.periodsDay,
          periodsTime: i.periodsTime,
        }
      }),
    })
    const { data } = response.data as BaseResponse<{ radiology: any }>
    return Radiology.from(data.radiology)
  }

  static async updateOne(
    id: number,
    body: {
      radiology: Radiology
      positionList?: Position[]
      discountList?: Discount[]
    },
  ) {
    const { radiology, discountList, positionList } = body
    const response = await AxiosInstance.patch(`/radiology/update/${id}`, {
      radiology: {
        radiologyCode: radiology.radiologyCode,
        name: radiology.name,
        radiologyGroupId: radiology.radiologyGroupId,
        printHtmlId: radiology.printHtmlId,
        costPrice: radiology.costPrice,
        price: radiology.price,
        requestNoteDefault: radiology.requestNoteDefault,
        descriptionDefault: radiology.descriptionDefault,
        resultDefault: radiology.resultDefault,
        customVariables: radiology.customVariables,
        customStyles: radiology.customStyles,
      },
      positionList: positionList
        ?.filter((i) => !!i.roleId)
        .map((i) => {
          return {
            roleId: i.roleId,
            commissionValue: i.commissionValue,
            commissionCalculatorType: i.commissionCalculatorType,
          }
        }),
      discountList: discountList?.map((i) => {
        return {
          priority: i.priority,
          isActive: i.isActive,
          // discountInteractType: i.discountInteractType,
          // discountInteractId: i.discountInteractId,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          discountRepeatType: i.discountRepeatType,
          periodsDay: i.periodsDay,
          periodsTime: i.periodsTime,
        }
      }),
    })
    const { data } = response.data as BaseResponse<{ radiology: any }>
    return Radiology.from(data.radiology)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/radiology/destroy/${id}`)
    const result = response.data as BaseResponse<{
      radiologyId: number
      ticketRadiologyList: TicketRadiology[]
    }>
    result.data.ticketRadiologyList = TicketRadiology.fromList(result.data.ticketRadiologyList)
    return result
  }

  static async systemList() {
    const response = await AxiosInstance.get('/radiology/system-list')
    const { data, time } = response.data as BaseResponse
    return Radiology.fromList(data)
  }

  static async systemCopy(body: { radiologyIdList: number[] }) {
    const response = await AxiosInstance.post('/radiology/system-copy', {
      radiologyIdList: body.radiologyIdList,
    })
    const { data, time } = response.data as BaseResponse<boolean>
    return data
  }
}
