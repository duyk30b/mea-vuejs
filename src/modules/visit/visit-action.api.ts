import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { VisitProcedure } from '../visit-procedure/visit-procedure.model'
import type { VisitProduct } from '../visit-product/visit-product.model'
import type { VisitRadiology } from '../visit-radiology'

export class VisitActionApi {
  static async replaceVisitProcedureList(body: {
    visitId: number
    customerId: number
    visitProcedureList: VisitProcedure[]
  }) {
    const response = await AxiosInstance.put(`/visit/replace-visit-procedure-list`, {
      visitId: body.visitId,
      customerId: body.customerId,
      visitProcedureList: body.visitProcedureList.map((i) => ({
        procedureId: i.procedureId,
        quantity: i.quantity,
        expectedPrice: i.expectedPrice,
        discountMoney: i.discountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        actualPrice: i.actualPrice,
        createdAt: i.createdAt,
      })),
    })
    const { data } = response.data as BaseResponse
  }

  static async replaceVisitRadiologyList(body: {
    visitId: number
    customerId: number
    visitRadiologyList: VisitRadiology[]
  }) {
    const plainList = body.visitRadiologyList.map((i) => {
      const plain: { [P in keyof VisitRadiology]?: any } = {}
      plain.radiologyId = i.radiologyId
      plain.expectedPrice = i.expectedPrice
      plain.discountMoney = i.discountMoney
      plain.discountPercent = i.discountPercent
      plain.discountType = i.discountType
      plain.actualPrice = i.actualPrice
      return plain
    })

    const response = await AxiosInstance.put(`/visit/replace-visit-radiology-list`, {
      visitId: body.visitId,
      customerId: body.customerId,
      visitRadiologyList: plainList,
    })
    const { data } = response.data as BaseResponse
  }

  static async replaceVisitPrescription(body: {
    visitId: number
    visitProductList: VisitProduct[]
    advice: string
  }) {
    const response = await AxiosInstance.put(`/visit/replace-visit-prescription`, {
      visitId: body.visitId,
      visitProductList: body.visitProductList.map((i) => ({
        productId: i.productId,
        unitRate: i.unitRate,
        quantityPrescription: i.quantityPrescription,
        quantity: i.quantity,
        costAmount: i.costAmount,
        expectedPrice: i.expectedPrice,
        discountMoney: i.discountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        actualPrice: i.actualPrice,
        hintUsage: i.hintUsage,
      })),
      advice: body.advice,
    })
    const { data } = response.data as BaseResponse
  }

  static async updateVisitItemsMoney(body: {
    visitId: number
    visitProductList: VisitProduct[]
    visitProcedureList: VisitProcedure[]
    visitRadiologyList: VisitRadiology[]
  }) {
    const visitProductList = body.visitProductList.map((item) => {
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        costAmount: item.costAmount,
        discountMoney: item.discountMoney,
        discountPercent: item.discountPercent,
        discountType: item.discountType,
        actualPrice: item.actualPrice,
      }
    })
    const visitProcedureList = body.visitProcedureList.map((item) => {
      return {
        id: item.id,
        procedureId: item.procedureId,
        discountMoney: item.discountMoney,
        discountPercent: item.discountPercent,
        discountType: item.discountType,
        actualPrice: item.actualPrice,
      }
    })
    const visitRadiologyList = body.visitRadiologyList.map((item) => {
      return {
        id: item.id,
        radiologyId: item.radiologyId,
        discountMoney: item.discountMoney,
        discountPercent: item.discountPercent,
        discountType: item.discountType,
        actualPrice: item.actualPrice,
      }
    })
    const response = await AxiosInstance.post(`/visit/update-visit-items-money`, {
      visitId: body.visitId,
      visitProductList,
      visitProcedureList,
      visitRadiologyList,
    })
    const { data } = response.data as BaseResponse
  }

  static async sendProductList(body: {
    visitId: number
    visitProductSendList: {
      visitProductId: number
      productId: number
      brandName: string
      hasManageQuantity: 0 | 1
      hasManageBatches: 0 | 1
      quantitySend: number
    }[]
    visitBatchSendList: {
      visitProductId: number
      productId: number
      batchId: number
      quantitySend: number
    }[]
  }) {
    const response = await AxiosInstance.post(`/visit/send-product-list`, body)
    const { data } = response.data as BaseResponse
  }

  static async returnProductList(body: {
    visitId: number
    visitProductReturnList: {
      visitProductId: number
      productId: number
      quantityReturn: number
      actualPrice: number
      costAmountReturn: number
      brandName: string
      hasManageQuantity: 0 | 1
      hasManageBatches: 0 | 1
    }[]
    visitBatchReturnList: {
      visitBatchId: number
      visitProductId: number
      productId: number
      batchId: number
      quantityReturn: number
    }[]
  }) {
    const response = await AxiosInstance.post(`/visit/return-product-list`, body)
    const { data } = response.data as BaseResponse
    return data
  }

  static async prepayment(visitId: number, money: number) {
    const response = await AxiosInstance.post(`/visit/prepayment`, { visitId, money })
    const { data } = response.data as BaseResponse
  }

  static async close(visitId: number) {
    const response = await AxiosInstance.post(`/visit/close/${visitId}`)
    const { data } = response.data as BaseResponse
  }

  static async refundOverpaid(visitId: number, money: number) {
    const response = await AxiosInstance.post(`/visit/refund-overpaid`, { visitId, money })
    const { data } = response.data as BaseResponse
  }

  static async reopen(visitId: number) {
    const response = await AxiosInstance.post(`/visit/reopen/${visitId}`)
    const { data } = response.data as BaseResponse
  }

  static async payDebt(visitId: number, money: number) {
    const response = await AxiosInstance.post(`/visit/pay-debt`, { visitId, money })
    const { data } = response.data as BaseResponse
  }
}
