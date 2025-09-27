import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  StockCheckDetailQuery,
  StockCheckGetQuery,
  StockCheckListQuery,
  StockCheckPaginationQuery,
} from './stock-check.dto'
import { StockCheck } from './stock-check.model'

export class StockCheckApi {
  static async pagination(options: StockCheckPaginationQuery) {
    const params = StockCheckGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/stock-check/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: StockCheck.fromList(data),
    }
  }

  static async list(options: StockCheckListQuery) {
    const params = StockCheckGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/stock-check/list', { params })
    const { data } = response.data as BaseResponse<{ stockCheckList: any[] }>
    return StockCheck.fromList(data.stockCheckList)
  }

  static async detail(stockCheckId: string, options: StockCheckDetailQuery): Promise<StockCheck> {
    const params = StockCheckGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/stock-check/detail/${stockCheckId}`, { params })
    const { data } = response.data as BaseResponse<{ stockCheck: any }>
    return StockCheck.from(data.stockCheck)
  }

  static async upsertDraft(stockCheck: StockCheck) {
    const response = await AxiosInstance.post(`/stock-check/upsert-draft`, {
      stockCheckId: stockCheck.id,
      stockCheckBody: {
        createdAt: stockCheck.createdAt,
        createdByUserId: stockCheck.createdByUserId,
        note: stockCheck.note,
      },
      stockCheckItemBodyList: (stockCheck.stockCheckItemList || []).map((i) => ({
        productId: i.productId,
        batchId: i.batchId,
        systemQuantity: i.systemQuantity,
        actualQuantity: i.actualQuantity,
        systemCostAmount: i.systemCostAmount,
        actualCostAmount: i.actualCostAmount,
        note: i.note,
      })),
    })
    const { data } = response.data as BaseResponse<{ stockCheck: StockCheck }>
    return data
  }

  static async draftDestroy(stockCheckId: string) {
    const response = await AxiosInstance.delete(`/stock-check/draft-destroy/${stockCheckId}`)

    const { data } = response.data as BaseResponse<{ stockCheckId: string }>
    return data
  }

  static async draftSubmit(stockCheckId: string) {
    const response = await AxiosInstance.post(`/stock-check/draft-submit/${stockCheckId}`)

    const { data } = response.data as BaseResponse<{ stockCheck: any }>
    return StockCheck.from(data.stockCheck)
  }

  static async pendingApprove(stockCheckId: string) {
    const response = await AxiosInstance.post(`/stock-check/pending-approve/${stockCheckId}`)

    const { data } = response.data as BaseResponse<{ stockCheck: any }>
    return StockCheck.from(data.stockCheck)
  }

  static async confirmReconcile(stockCheckId: string) {
    const response = await AxiosInstance.post(`/stock-check/confirm-reconcile/${stockCheckId}`)

    const { data } = response.data as BaseResponse<{ stockCheck: any }>
    return StockCheck.from(data.stockCheck)
  }

  static async void(stockCheckId: string) {
    const response = await AxiosInstance.post(`/stock-check/void/${stockCheckId}`)

    const { data } = response.data as BaseResponse<{ stockCheck: any }>
    return StockCheck.from(data.stockCheck)
  }

  static async cancelledDestroy(stockCheckId: string) {
    const response = await AxiosInstance.delete(`/stock-check/cancelled-destroy/${stockCheckId}`)

    const { data } = response.data as BaseResponse<{ stockCheckId: string }>
    return data
  }
}
