import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
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
    return {
      time: new Date(time),
      data: Procedure.fromList(data),
    }
  }

  static search: (params: ProcedureListQuery) => Promise<Procedure[]> = debounceAsync(
    async (params: ProcedureListQuery): Promise<Procedure[]> => {
      const response = await AxiosInstance.get('/procedure/list', { params })
      const { data } = response.data as BaseResponse
      return Procedure.fromList(data)
    },
    200
  )

  static async detail(id: number, options: ProcedureDetailQuery): Promise<Procedure> {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/procedure/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }

  static async createOne(procedure: Procedure) {
    const response = await AxiosInstance.post('/procedure/create', {
      name: procedure.name,
      group: procedure.name,

      procedureType: procedure.procedureType,
      quantityDefault: procedure.quantityDefault,
      gapHours: procedure.gapHours,
      price: procedure.price, // Giá mặc định

      discountMoney: procedure.discountMoney, // tiền giảm giá mặc định
      discountPercent: procedure.discountPercent,
      discountType: procedure.discountType,
      discountStart: procedure.discountStart != null ? procedure.discountStart : null,
      discountEnd: procedure.discountEnd != null ? procedure.discountEnd : null,

      saleBolusMoney: procedure.saleBolusMoney, // thưởng chốt sale
      saleBolusPercent: procedure.saleBolusPercent, // thưởng chốt sale
      saleBolusType: procedure.saleBolusType, // thưởng chốt sale
      primaryBolusMoney: procedure.primaryBolusMoney, // thưởng thợ chính
      primaryBolusPercent: procedure.primaryBolusPercent, // thưởng thợ chính
      primaryBolusType: procedure.primaryBolusType, // thưởng thợ chính
      secondaryBolusMoney: procedure.secondaryBolusMoney, // thưởng thợ phụ
      secondaryBolusPercent: procedure.secondaryBolusPercent, // thưởng thợ phụ
      secondaryBolusType: procedure.secondaryBolusType, // thưởng thợ phụ

      consumablesHint: procedure.consumablesHint,
      isActive: procedure.isActive,
    })
    const { data } = response.data as BaseResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }

  static async updateOne(id: number, procedure: Procedure) {
    const response = await AxiosInstance.patch(`/procedure/update/${id}`, {
      name: procedure.name,
      group: procedure.name,

      procedureType: procedure.procedureType,
      quantityDefault: procedure.quantityDefault,
      gapHours: procedure.gapHours,
      price: procedure.price, // Giá mặc định

      discountMoney: procedure.discountMoney, // tiền giảm giá mặc định
      discountPercent: procedure.discountPercent,
      discountType: procedure.discountType,
      discountStart: procedure.discountStart != null ? procedure.discountStart : null,
      discountEnd: procedure.discountEnd != null ? procedure.discountEnd : null,

      saleBolusMoney: procedure.saleBolusMoney, // thưởng chốt sale
      saleBolusPercent: procedure.saleBolusPercent, // thưởng chốt sale
      saleBolusType: procedure.saleBolusType, // thưởng chốt sale
      primaryBolusMoney: procedure.primaryBolusMoney, // thưởng thợ chính
      primaryBolusPercent: procedure.primaryBolusPercent, // thưởng thợ chính
      primaryBolusType: procedure.primaryBolusType, // thưởng thợ chính
      secondaryBolusMoney: procedure.secondaryBolusMoney, // thưởng thợ phụ
      secondaryBolusPercent: procedure.secondaryBolusPercent, // thưởng thợ phụ
      secondaryBolusType: procedure.secondaryBolusType, // thưởng thợ phụ

      consumablesHint: procedure.consumablesHint,
      isActive: procedure.isActive,
    })
    const { data } = response.data as BaseResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/procedure/delete/${id}`)
    const { data } = response.data as BaseResponse<{ procedure: any }>
    return Procedure.from(data.procedure)
  }
}
