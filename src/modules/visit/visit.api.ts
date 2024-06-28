import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import { VisitDiagnosis } from '../visit-diagnosis'
import { VisitProcedure } from '../visit-procedure/visit-procedure.model'
import { VisitProduct } from '../visit-product/visit-product.model'
import type { VisitRadiology } from '../visit-radiology'
import {
  VisitDetailQuery,
  VisitGetQuery,
  VisitListQuery,
  type VisitPaginationQuery,
} from './visit.dto'
import { Visit } from './visit.model'

export class VisitApi {
  static async pagination(options: VisitPaginationQuery) {
    const params = VisitGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/visit/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Visit.fromPlains(data),
    }
  }

  static async list(options: VisitListQuery) {
    const params = VisitGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/visit/list', { params })
    const { data } = response.data as BaseResponse
    return Visit.fromPlains(data)
  }

  static async detail(id: number, options: VisitDetailQuery): Promise<Visit> {
    const params = VisitGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/visit/detail/${id}`, { params })
    const { data } = response.data as BaseResponse
    return Visit.fromPlain(data)
  }

  static async registerWithExistCustomer(body: { customerId: number; registeredAt: number }) {
    const response = await AxiosInstance.post('/visit/register-with-exist-customer', body)
    const { data } = response.data as BaseResponse<{ visit: any }>
  }

  static async registerWithNewCustomer(body: { customer: Customer; registeredAt: number }) {
    const response = await AxiosInstance.post('/visit/register-with-new-customer', {
      registeredAt: body.registeredAt,
      customer: Customer.toPlain(body.customer, 'USER_CREATE'),
    })
    const { data } = response.data as BaseResponse<{ visit: any }>
  }

  static async startCheckup(params: { visitId: number }) {
    const response = await AxiosInstance.post(`visit/${params.visitId}/start-checkup`)
    const { data } = response.data as BaseResponse<{ visitBasic: any }>
  }

  static async updateVisitDiagnosis(body: {
    visitId: number
    customerId: number
    visitDiagnosisId: number
    visitDiagnosis: VisitDiagnosis
    imageIdsKeep: number[]
    files: File[]
  }) {
    const { visitId, customerId, visitDiagnosisId, visitDiagnosis, files, imageIdsKeep } = body
    const visitDiagnosisPlain = VisitDiagnosis.toPlain(visitDiagnosis, 'USER_UPDATE')
    visitDiagnosisPlain.imageIdsKeep = imageIdsKeep

    const formData = new FormData()
    formData.append('visitId', visitId.toString())
    formData.append('customerId', customerId.toString())
    formData.append('visitDiagnosisId', visitDiagnosisId.toString())
    formData.append('visitDiagnosis', JSON.stringify(visitDiagnosisPlain))
    files.forEach((file, index) => formData.append('files', file))

    const response = await AxiosInstance.post(`/visit/update-visit-diagnosis`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const { data } = response.data as BaseResponse<{
      visitId: number
      visitDiagnosis: any
    }>
  }

  static async replaceVisitProcedureList(body: {
    visitId: number
    customerId: number
    visitProcedureList: VisitProcedure[]
  }) {
    const visitProcedureListPlain = VisitProcedure.toPlains(body.visitProcedureList, 'USER_CREATE')

    const response = await AxiosInstance.put(`/visit/replace-visit-procedure-list`, {
      visitId: body.visitId,
      customerId: body.customerId,
      visitProcedureList: visitProcedureListPlain,
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
    const visitProductListPlain = VisitProduct.toPlains(body.visitProductList, 'USER_CREATE')
    const response = await AxiosInstance.put(`/visit/replace-visit-prescription`, {
      visitId: body.visitId,
      visitProductList: visitProductListPlain,
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
