import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { FullResponse } from '../_base/base-dto'
import type { Discount } from '../discount'
import type { Position } from '../position'
import { TicketProcedure } from '../ticket-procedure'
import {
    ProcedureDetailQuery,
    ProcedureGetQuery,
    ProcedureListQuery,
    type ProcedurePaginationQuery,
} from './procedure.dto'
import { Procedure } from './procedure.model'

export class ProcedureApi {
  static async pagination(options: ProcedurePaginationQuery) {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/procedure/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      limit: data.limit,
      total: data.total,
      procedureList: Procedure.fromList(data.procedureList),
    }
  }

  static async list(options: ProcedureListQuery) {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/procedure/list', { params })
    const { data, time } = response.data as FullResponse<{ procedureList: any[] }>
    return Procedure.fromList(data.procedureList)
  }

  static search: (params: ProcedureListQuery) => Promise<Procedure[]> = debounceAsync(
    async (params: ProcedureListQuery): Promise<Procedure[]> => {
      const response = await AxiosInstance.get('/procedure/list', { params })
      const { data } = response.data as FullResponse
      return Procedure.fromList(data)
    },
    200,
  )

  static async detail(id: number, options: ProcedureDetailQuery): Promise<Procedure> {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/procedure/detail/${id}`, { params })
    const { data } = response.data as FullResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }

  static async createOne(body: {
    procedure: Procedure
    positionRequestList?: Position[]
    positionResultList?: Position[]
    discountList?: Discount[]
  }) {
    const { procedure, discountList, positionRequestList, positionResultList } = body
    const response = await AxiosInstance.post('/procedure/create', {
      procedure: {
        code: procedure.code,
        name: procedure.name,
        procedureGroupId: procedure.procedureGroupId,
        procedureType: procedure.procedureType,
        price: procedure.price,
        isActive: procedure.isActive,
      },
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
    const { data } = response.data as FullResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }

  static async updateOne(
    id: number,
    body: {
      procedure: Procedure
      positionRequestList?: Position[]
      positionResultList?: Position[]
      discountList?: Discount[]
    },
  ) {
    const { procedure, discountList, positionRequestList, positionResultList } = body
    const response = await AxiosInstance.post(`/procedure/update/${id}`, {
      procedure: {
        code: procedure.code,
        name: procedure.name,
        procedureGroupId: procedure.procedureGroupId,
        procedureType: procedure.procedureType,
        price: procedure.price,
        isActive: procedure.isActive,
      },
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
    const { data } = response.data as FullResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/procedure/destroy/${id}`)
    const { data } = response.data as FullResponse<{
      procedureId: number
      ticketProcedureList: TicketProcedure[]
      success: boolean
    }>
    data.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
    return data
  }
}
