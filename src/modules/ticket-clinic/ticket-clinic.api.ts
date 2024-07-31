import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { Customer } from '../customer'
import type { TicketProcedure } from '../ticket-procedure'
import type { TicketProduct } from '../ticket-product'
import type { TicketRadiology } from '../ticket-radiology'

export class TicketClinicApi {
  static async registerWithExistCustomer(body: { customerId: number; registeredAt: number }) {
    const response = await AxiosInstance.post('/ticket-clinic/register-with-exist-customer', body)
    const { data } = response.data as BaseResponse<{ ticket: any }>
  }

  static async registerWithNewCustomer(body: { customer: Customer; registeredAt: number }) {
    const { customer } = body
    const response = await AxiosInstance.post('/ticket-clinic/register-with-new-customer', {
      registeredAt: body.registeredAt,
      customer: {
        fullName: customer.fullName,
        phone: customer.phone,
        birthday: customer.birthday,
        gender: customer.gender,
        identityCard: customer.identityCard, // số căn cước
        addressProvince: customer.addressProvince,
        addressDistrict: customer.addressDistrict,
        addressWard: customer.addressWard,
        addressStreet: customer.addressStreet,
        relative: customer.relative, // người thân
        healthHistory: customer.healthHistory, // Tiền sử bệnh
        note: customer.note,
        isActive: customer.isActive, // Trạng thái
      },
    })
    const { data } = response.data as BaseResponse<{ ticket: any }>
  }

  static async startCheckup(params: { ticketId: number }) {
    const response = await AxiosInstance.post(`/ticket-clinic/${params.ticketId}/start-checkup`)
    const { data } = response.data as BaseResponse<{ ticketBasic: any }>
  }

  static async updateDiagnosis(options: {
    ticketId: number
    object: {
      customerId: number
      reason: string
      healthHistory: string
      summary: string
      diagnosis: string
      vitalSigns: string
    }
    imageIdsKeep: number[]
    files: File[]
    filesPosition: number[]
  }) {
    const { ticketId, object, imageIdsKeep, files, filesPosition } = options
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('filesPosition', JSON.stringify(filesPosition))
    formData.append('imageIdsKeep', JSON.stringify(imageIdsKeep))
    formData.append('customerId', object.customerId.toString())
    formData.append('reason', object.reason)
    formData.append('healthHistory', object.healthHistory)
    formData.append('summary', object.summary)
    formData.append('diagnosis', object.diagnosis)
    formData.append('vitalSigns', object.vitalSigns)

    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-diagnosis`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    const { data } = response.data as BaseResponse
  }

  static async changeTicketProcedureList(body: {
    ticketId: number
    customerId: number
    ticketProcedureList: TicketProcedure[]
  }) {
    const { ticketId, customerId, ticketProcedureList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/change-ticket-procedure-list`,
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
          createdAt: i.createdAt,
        })),
      }
    )
    const { data } = response.data as BaseResponse
  }

  static async changeTicketRadiologyList(body: {
    ticketId: number
    customerId: number
    ticketRadiologyList: TicketRadiology[]
  }) {
    const { ticketId, customerId, ticketRadiologyList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/change-ticket-radiology-list`,
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

  static async createTicketRadiology(options: { ticketRadiology: TicketRadiology; files: File[] }) {
    const { ticketRadiology, files } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('customerId', ticketRadiology.customerId.toString())
    formData.append('radiologyId', ticketRadiology.radiologyId.toString())
    formData.append('doctorId', ticketRadiology.doctorId.toString())
    formData.append('expectedPrice', ticketRadiology.expectedPrice.toString())
    formData.append('discountMoney', ticketRadiology.discountMoney.toString())
    formData.append('discountPercent', ticketRadiology.discountPercent.toString())
    formData.append('discountType', ticketRadiology.discountType)
    formData.append('actualPrice', ticketRadiology.actualPrice.toString())
    formData.append('description', ticketRadiology.description)
    formData.append('result', ticketRadiology.result)
    formData.append('startedAt', ticketRadiology.startedAt.toString())

    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketRadiology.ticketId}/create-ticket-radiology`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    const { data } = response.data as BaseResponse<{ ticketRadiologyId: number }>
    return data
  }

  static async updateTicketRadiology(options: {
    ticketRadiology: TicketRadiology
    imageIdsKeep: number[]
    files: File[]
    filesPosition: number[]
  }) {
    const { ticketRadiology, imageIdsKeep, files, filesPosition } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('doctorId', ticketRadiology.doctorId.toString())
    formData.append('description', ticketRadiology.description)
    formData.append('result', ticketRadiology.result)
    formData.append('startedAt', ticketRadiology.startedAt.toString())
    formData.append('ticketRadiologyId', ticketRadiology.id.toString())
    formData.append('imageIdsKeep', JSON.stringify(imageIdsKeep))
    formData.append('filesPosition', JSON.stringify(filesPosition))

    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketRadiology.ticketId}/update-ticket-radiology`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    const { data } = response.data as BaseResponse<{ ticketRadiologyId: number }>
    return data
  }

  static async changePrescription(body: {
    ticketId: number
    ticketProductList: TicketProduct[]
    advice: string
  }) {
    const { ticketId, ticketProductList, advice } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/change-prescription`, {
      ticketProductList: ticketProductList.map((i) => ({
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
    })
    const { data } = response.data as BaseResponse
  }

  static async changeConsumable(body: { ticketId: number; ticketProductList: TicketProduct[] }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/change-consumable`, {
      ticketProductList: ticketProductList.map((i) => ({
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
    })
    const { data } = response.data as BaseResponse
  }

  static async changeItemsMoney(body: {
    ticketId: number
    ticketProductList: TicketProduct[]
    ticketProcedureList: TicketProcedure[]
    ticketRadiologyList: TicketRadiology[]
  }) {
    const { ticketId, ticketProductList, ticketProcedureList, ticketRadiologyList } = body

    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/change-items-money`, {
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

  static async destroyDraft(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-clinic/${ticketId}/destroy-draft`)
    const { data } = response.data as BaseResponse
  }
}
