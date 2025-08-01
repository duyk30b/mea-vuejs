import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
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
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Procedure.fromList(data),
    }
  }

  static async list(options: ProcedureListQuery) {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/procedure/list', { params })
    const { data, time } = response.data as BaseResponse
    return Procedure.fromList(data)
  }

  static search: (params: ProcedureListQuery) => Promise<Procedure[]> = debounceAsync(
    async (params: ProcedureListQuery): Promise<Procedure[]> => {
      const response = await AxiosInstance.get('/procedure/list', { params })
      const { data } = response.data as BaseResponse
      return Procedure.fromList(data)
    },
    200,
  )

  static async detail(id: number, options: ProcedureDetailQuery): Promise<Procedure> {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/procedure/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }

  static async createOne(body: {
    procedure: Procedure
    positionList?: Position[]
    discountList?: Discount[]
  }) {
    const { procedure, discountList, positionList } = body
    const response = await AxiosInstance.post('/procedure/create', {
      procedure: {
        procedureCode: procedure.procedureCode,
        name: procedure.name,
        procedureGroupId: procedure.procedureGroupId,

        procedureType: procedure.procedureType,
        quantityDefault: procedure.quantityDefault,
        gapHours: procedure.gapHours,
        price: procedure.price, // Giá mặc định

        consumablesHint: procedure.consumablesHint,
        isActive: procedure.isActive,
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
    const { data } = response.data as BaseResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }

  static async updateOne(
    id: number,
    body: {
      procedure: Procedure
      positionList?: Position[]
      discountList?: Discount[]
    },
  ) {
    const { procedure, discountList, positionList } = body
    const response = await AxiosInstance.patch(`/procedure/update/${id}`, {
      procedure: {
        procedureCode: procedure.procedureCode,
        name: procedure.name,
        procedureGroupId: procedure.procedureGroupId,

        procedureType: procedure.procedureType,
        quantityDefault: procedure.quantityDefault,
        gapHours: procedure.gapHours,
        price: procedure.price, // Giá mặc định

        consumablesHint: procedure.consumablesHint,
        isActive: procedure.isActive,
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
    const { data } = response.data as BaseResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/procedure/destroy/${id}`)
    const result = response.data as BaseResponse<{
      procedureId: number
      ticketProcedureList: TicketProcedure[]
    }>
    result.data.ticketProcedureList = TicketProcedure.fromList(result.data.ticketProcedureList)
    return result
  }
}
