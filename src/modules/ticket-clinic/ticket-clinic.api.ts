import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { VoucherType } from '../enum'
import type { TicketDiagnosis } from '../ticket-diagnosis'
import type { TicketProcedure } from '../ticket-procedure'
import type { TicketProduct } from '../ticket-product'
import type { TicketRadiology } from '../ticket-radiology'
import { Ticket } from '../ticket/ticket.model'

export class TicketClinicApi {
  static async register(body: {
    fromAppointmentId: number
    customerId: number
    voucherType: VoucherType.Clinic
    registeredAt: number
    reason: string
    customerSourceId: number
  }) {
    const response = await AxiosInstance.post('/ticket-clinic/register', body)
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return Ticket.from(data.ticket)
  }

  static async destroyDraftSchedule(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-clinic/${ticketId}/destroy-draft-schedule`)
    const { data } = response.data as BaseResponse
  }

  static async startCheckup(params: { ticketId: number }) {
    const response = await AxiosInstance.post(`/ticket-clinic/${params.ticketId}/start-checkup`)
    const { data } = response.data as BaseResponse<{ ticketBasic: any }>
  }

  static async updateDiagnosisBasic(options: {
    ticketId: number
    customerId: number
    object: Pick<
      TicketDiagnosis,
      'reason' | 'healthHistory' | 'general' | 'regional' | 'summary' | 'diagnosis'
    >
    imageIdsKeep: number[]
    files: File[]
    filesPosition: number[]
  }) {
    const { ticketId, customerId, object, imageIdsKeep, files, filesPosition } = options
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('filesPosition', JSON.stringify(filesPosition))
    formData.append('imageIdsKeep', JSON.stringify(imageIdsKeep))
    formData.append('customerId', customerId.toString())
    formData.append('reason', object.reason)
    formData.append('healthHistory', object.healthHistory)
    formData.append('general', object.general)
    formData.append('regional', object.regional)
    formData.append('summary', object.summary || '')
    formData.append('diagnosis', object.diagnosis)

    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-diagnosis-basic`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    const { data } = response.data as BaseResponse
  }

  static async updateTicketProcedureList(body: {
    ticketId: number
    customerId: number
    ticketProcedureList: TicketProcedure[]
  }) {
    const { ticketId, customerId, ticketProcedureList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-procedure-list`,
      {
        customerId: customerId,
        ticketProcedureList: ticketProcedureList.map((i) => ({
          procedureId: i.procedureId,
          quantity: i.quantity,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
        })),
      }
    )
    const { data } = response.data as BaseResponse
  }

  static async updateTicketRadiologyList(body: {
    ticketId: number
    customerId: number
    ticketRadiologyList: TicketRadiology[]
  }) {
    const { ticketId, customerId, ticketRadiologyList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-radiology-list`,
      {
        customerId: customerId,
        ticketRadiologyList: ticketRadiologyList.map((i) => {
          const plain: { [P in keyof TicketRadiology]?: any } = {}
          plain.radiologyId = i.radiologyId
          plain.expectedPrice = i.expectedPrice
          plain.discountMoney = i.discountMoney
          plain.discountPercent = i.discountPercent
          plain.discountType = i.discountType
          plain.actualPrice = i.actualPrice
          return plain
        }),
      }
    )
    const { data } = response.data as BaseResponse
  }

  static async updateTicketProductConsumable(body: {
    ticketId: number
    ticketProductConsumableList: TicketProduct[]
  }) {
    const { ticketId, ticketProductConsumableList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-product-consumable`,
      {
        ticketProductConsumableList: ticketProductConsumableList.map((i) => ({
          productId: i.productId,
          batchId: i.batchId,
          unitRate: i.unitRate,
          quantity: i.quantity,
          costAmount: i.costAmount,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
        })),
      }
    )
    const { data } = response.data as BaseResponse
  }

  static async updateTicketProductPrescription(body: {
    ticketId: number
    ticketProductPrescriptionList?: TicketProduct[]
    advice?: string
  }) {
    const { ticketId, ticketProductPrescriptionList, advice } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-product-prescription`,
      {
        ticketProductPrescriptionList: ticketProductPrescriptionList?.map((i) => ({
          productId: i.productId,
          batchId: i.batchId,
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
        advice,
      }
    )
    const { data } = response.data as BaseResponse
  }

  static async updateItemsMoney(body: {
    ticketId: number
    ticketProductList: TicketProduct[]
    ticketProcedureList: TicketProcedure[]
    ticketRadiologyList: TicketRadiology[]
  }) {
    const { ticketId, ticketProductList, ticketProcedureList, ticketRadiologyList } = body

    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/update-items-money`, {
      ticketProductUpdateList: ticketProductList.map((item) => {
        return {
          ticketProductId: item.id,
          productId: item.productId,
          quantity: item.quantity,
          costAmount: item.costAmount,
          discountMoney: item.discountMoney,
          discountPercent: item.discountPercent,
          discountType: item.discountType,
          actualPrice: item.actualPrice,
        }
      }),
      ticketProcedureUpdateList: ticketProcedureList.map((item) => {
        return {
          ticketProcedureId: item.id,
          procedureId: item.procedureId,
          discountMoney: item.discountMoney,
          discountPercent: item.discountPercent,
          discountType: item.discountType,
          actualPrice: item.actualPrice,
        }
      }),
      ticketRadiologyUpdateList: ticketRadiologyList.map((item) => {
        return {
          ticketRadiologyId: item.id,
          radiologyId: item.radiologyId,
          discountMoney: item.discountMoney,
          discountPercent: item.discountPercent,
          discountType: item.discountType,
          actualPrice: item.actualPrice,
        }
      }),
    })
    const { data } = response.data as BaseResponse
  }

  static async sendProduct(body: { ticketId: number }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/send-product`)
    const { data } = response.data as BaseResponse
  }

  static async returnProduct(body: {
    ticketId: number
    returnList: {
      ticketProductId: number
      quantityReturn: number
      actualPrice: number
      costAmountReturn: number
    }[]
  }) {
    const { ticketId, returnList } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/return-product`, {
      returnList,
    })
    const { data } = response.data as BaseResponse
    return data
  }

  static async prepayment(ticketId: number, money: number) {
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/prepayment`, { money })
    const { data } = response.data as BaseResponse
  }

  static async refundOverpaid(ticketId: number, money: number) {
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/refund-overpaid`, {
      money,
    })
    const { data } = response.data as BaseResponse
  }

  static async payDebt(ticketId: number, money: number) {
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/pay-debt`, {
      money,
    })
    const { data } = response.data as BaseResponse
  }

  static async close(ticketId: number) {
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/close`)
    const { data } = response.data as BaseResponse
  }

  static async reopen(ticketId: number) {
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/reopen`)
    const { data } = response.data as BaseResponse
  }
}
