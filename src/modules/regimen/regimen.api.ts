import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import type { Discount } from '../discount'
import type { Position } from '../position'
import { TicketRegimen } from '../ticket-regimen'
import type { RegimenItem } from './regimen-item.model'
import {
    RegimenDetailQuery,
    RegimenGetQuery,
    RegimenListQuery,
    type RegimenPaginationQuery,
} from './regimen.dto'
import { Regimen } from './regimen.model'

export class RegimenApi {
  static async pagination(options: RegimenPaginationQuery) {
    const params = RegimenGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/regimen/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      limit: data.limit,
      total: data.total,
      regimenList: Regimen.fromList(data.regimenList),
    }
  }

  static async list(options: RegimenListQuery) {
    const params = RegimenGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/regimen/list', { params })
    const { data, time } = response.data as FullResponse<{ regimenList: any[] }>
    return Regimen.fromList(data.regimenList)
  }

  // static search: (params: RegimenListQuery) => Promise<Regimen[]> = debounceAsync(
  //   async (params: RegimenListQuery): Promise<Regimen[]> => {
  //     const response = await AxiosInstance.get('/regimen/list', { params })
  //     const { data } = response.data as FullResponse
  //     return Regimen.fromList(data)
  //   },
  //   200,
  // )

  static async detail(id: number, options: RegimenDetailQuery): Promise<Regimen> {
    const params = RegimenGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/regimen/detail/${id}`, { params })
    const { data } = response.data as FullResponse<{ regimen: any }>
    return Regimen.from(data.regimen)
  }

  static async createOne(body: {
    regimen: Regimen
    regimenItemList: RegimenItem[]
    positionRequestList?: Position[]
    positionResultList?: Position[]
    discountList?: Discount[]
  }) {
    const { regimen, regimenItemList, discountList, positionRequestList, positionResultList } = body
    const response = await AxiosInstance.post('/regimen/create', {
      regimen: {
        code: regimen.code,
        name: regimen.name,
        isActive: regimen.isActive,
      },
      regimenItemList: regimenItemList.map((regimenItem) => {
        return {
          procedureId: regimenItem.procedureId,
          quantity: regimenItem.quantity,
          gapDay: regimenItem.gapDay,
        }
      }),
      positionRequestList: positionRequestList
        ?.filter((i) => !!i.roleId)
        .map((i) => {
          return {
            priority: i.priority,
            roleId: i.roleId,
            commissionValue: i.commissionValue,
            commissionCalculatorType: i.commissionCalculatorType,
          }
        }),
      positionResultList: positionResultList
        ?.filter((i) => !!i.roleId)
        .map((i) => {
          return {
            priority: i.priority,
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
    const { data } = response.data as FullResponse<{ regimen: any }>
    return Regimen.from(data.regimen)
  }

  static async updateOne(
    id: number,
    body: {
      regimen: Regimen
      regimenItemList: RegimenItem[]
      positionRequestList?: Position[]
      positionResultList?: Position[]
      discountList?: Discount[]
    },
  ) {
    const { regimen, regimenItemList, discountList, positionRequestList, positionResultList } = body
    const response = await AxiosInstance.post(`/regimen/update/${id}`, {
      regimen: {
        code: regimen.code,
        name: regimen.name,
        isActive: regimen.isActive,
      },
      regimenItemList: regimenItemList.map((regimenItem) => {
        return {
          procedureId: regimenItem.procedureId,
          quantity: regimenItem.quantity,
          gapDay: regimenItem.gapDay,
        }
      }),
      positionRequestList: positionRequestList
        ?.filter((i) => !!i.roleId)
        .map((i) => {
          return {
            priority: i.priority,
            roleId: i.roleId,
            commissionValue: i.commissionValue,
            commissionCalculatorType: i.commissionCalculatorType,
          }
        }),
      positionResultList: positionResultList
        ?.filter((i) => !!i.roleId)
        .map((i) => {
          return {
            priority: i.priority,
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
    const { data } = response.data as FullResponse<{ regimen: any }>
    return Regimen.from(data.regimen)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/regimen/destroy/${id}`)
    const { data } = response.data as FullResponse<{
      regimenId: number
      ticketRegimenList: TicketRegimen[]
      success: boolean
    }>
    data.ticketRegimenList = TicketRegimen.fromList(data.ticketRegimenList)
    return data
  }
}
