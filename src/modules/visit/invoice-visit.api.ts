import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { Visit } from './visit.model'

export class InvoiceVisitApi {
  static async createDraft(visit: Visit) {
    const response = await AxiosInstance.post('/invoice-visit/create-draft', {
      visitDraftInsert: {
        customerId: visit.customerId,
        totalCostAmount: visit.totalCostAmount,
        proceduresMoney: visit.proceduresMoney,
        productsMoney: visit.productsMoney,
        radiologyMoney: visit.radiologyMoney,
        discountMoney: visit.discountMoney,
        discountPercent: visit.discountPercent,
        discountType: visit.discountType,
        surcharge: visit.surcharge,
        totalMoney: visit.totalMoney,
        expense: visit.expense,
        profit: visit.profit,
        note: visit.note,
        registeredAt: visit.registeredAt,
      },
      visitProductDraftList: (visit.visitProductList || []).map((i) => ({
        productId: i.productId,
        unitRate: i.unitRate,
        quantity: i.quantity,
        costAmount: i.costAmount,
        expectedPrice: i.expectedPrice,
        discountMoney: i.discountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        actualPrice: i.actualPrice,
        hintUsage: i.hintUsage,
        visitBatchDraftList: (i.visitBatchList || []).map((j) => ({
          batchId: j.batchId,
          quantity: j.quantity,
        })),
      })),
      visitProcedureDraftList: (visit.visitProcedureList || []).map((i) => ({
        procedureId: i.procedureId,
        quantity: i.quantity,
        expectedPrice: i.expectedPrice,
        discountMoney: i.discountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        actualPrice: i.actualPrice,
      })),
      visitSurchargeDraftList: (visit.visitSurchargeList || []).map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
      visitExpenseDraftList: visit.visitExpenseList?.map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
    })
    const { data } = response.data as BaseResponse<{ visitId: number }>
    return data
  }

  static async updateInvoiceDraftAndInvoicePrepayment(visitId: number, visit: Visit) {
    const response = await AxiosInstance.patch(
      `/invoice-visit/update-invoice-draft-and-invoice-prepayment/${visitId}`,
      {
        visitDraftInsert: [],
        visitProductDraftList: (visit.visitProductList || []).map((i) => ({
          productId: i.productId,
          unitRate: i.unitRate,
          quantity: i.quantity,
          costAmount: i.costAmount,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
          hintUsage: i.hintUsage,
          visitBatchDraftList: (i.visitBatchList || []).map((j) => ({
            batchId: j.batchId,
            quantity: j.quantity,
          })),
        })),
        visitProcedureDraftList: (visit.visitProcedureList || []).map((i) => ({
          procedureId: i.procedureId,
          quantity: i.quantity,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
        })),
        visitSurchargeDraftList: (visit.visitSurchargeList || []).map((i) => ({
          key: i.key,
          name: i.name,
          money: i.money,
        })),
        visitExpenseDraftList: visit.visitExpenseList?.map((i) => ({
          key: i.key,
          name: i.name,
          money: i.money,
        })),
      }
    )
    const { data } = response.data as BaseResponse<{ visitId: number }>
    return data
  }

  static async destroyDraft(visitId: number) {
    const response = await AxiosInstance.delete(`/invoice-visit/destroy-draft/${visitId}`)
    const { data } = response.data as BaseResponse<{ visitId: number }>
    return data
  }
}
