import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { Customer } from '../customer'
import type { DiscountType } from '../enum'
import type { TicketLaboratory } from '../ticket-laboratory'
import { TicketProcedure } from '../ticket-procedure'
import type { TicketProduct } from '../ticket-product'
import type { TicketRadiology } from '../ticket-radiology'
import type { TicketUser } from '../ticket-user'
import { TicketStatus, type TicketType } from '../ticket/ticket.model'

export class TicketClinicApi {
  static async create(body: {
    customer?: Customer
    ticketInformation: {
      ticketType: TicketType
      ticketStatus: TicketStatus
      customerSourceId: number
      registeredAt: number
      customerId: number
      fromAppointmentId: number
    }
    ticketAttributeList: { key: string; value: any }[]
    ticketUserList: TicketUser[]
  }) {
    const { customer, ticketInformation, ticketAttributeList, ticketUserList } = body
    const response = await AxiosInstance.post('/ticket-clinic/create', {
      customer:
        ticketInformation.customerId === 0 && customer
          ? {
              fullName: customer.fullName,
              phone: customer.phone,
              birthday: customer.birthday,
              yearOfBirth: customer.yearOfBirth,
              gender: customer.gender,
              addressProvince: customer.addressProvince,
              addressDistrict: customer.addressDistrict,
              addressWard: customer.addressWard,
              addressStreet: customer.addressStreet,
              relative: customer.relative,
              healthHistory: customer.healthHistory,
              customerSourceId: customer.customerSourceId || 0,
              note: customer.note,
              isActive: customer.isActive,
            }
          : undefined,
      ticketInformation: {
        customerId: ticketInformation.customerId,
        fromAppointmentId: ticketInformation.fromAppointmentId,
        customerSourceId: ticketInformation.customerSourceId || 0,
        ticketType: ticketInformation.ticketType,
        ticketStatus: ticketInformation.ticketStatus,
        registeredAt: ticketInformation.registeredAt,
      },
      ticketAttributeList: body.ticketAttributeList.map((i) => {
        return { key: i.key, value: i.value }
      }),
      ticketUserList: body.ticketUserList.map((i) => {
        return { userId: i.userId || 0, roleId: i.roleId }
      }),
    })
    const { data } = response.data as BaseResponse<boolean>
  }

  static async update(body: {
    ticketId: number
    ticketInformation: {
      customerSourceId: number
      registeredAt: number
    }
    ticketAttributeList: { key: string; value: any }[]
    ticketUserList: TicketUser[]
  }) {
    const { ticketId, ticketInformation, ticketAttributeList, ticketUserList } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/update`, {
      ticketInformation: {
        customerSourceId: ticketInformation.customerSourceId || 0,
        registeredAt: ticketInformation.registeredAt,
      },
      ticketAttributeList: ticketAttributeList.map((i) => {
        return { key: i.key, value: i.value != null ? i.value : '' }
      }),
      ticketUserList: ticketUserList.map((i) => {
        return { userId: i.userId || 0, roleId: i.roleId }
      }),
    })
    const { data } = response.data as BaseResponse<boolean>
  }

  static async startCheckup(params: { ticketId: number }) {
    const response = await AxiosInstance.post(`/ticket-clinic/${params.ticketId}/start-checkup`)
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateDiagnosis(options: {
    ticketId: number
    files: File[]
    imagesChange?: {
      imageIdsKeep: number[]
      filesPosition: number[]
    }
    ticketAttributeChangeList?: { key: string; value: any }[]
    ticketAttributeKeyList: string[]
  }) {
    const { ticketId, imagesChange, ticketAttributeChangeList, files } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('ticketAttributeKeyList', JSON.stringify(options.ticketAttributeKeyList))

    if (imagesChange) {
      const imagesChangeStr = JSON.stringify({
        imageIdsKeep: imagesChange.imageIdsKeep,
        filesPosition: imagesChange.filesPosition,
      })
      formData.append('imagesChange', imagesChangeStr)
    }
    if (ticketAttributeChangeList) {
      const ticketAttributeChangeListStr = JSON.stringify(
        ticketAttributeChangeList.map((i) => {
          return { key: i.key, value: i.value }
        })
      )
      formData.append('ticketAttributeChangeList', ticketAttributeChangeListStr)
    }

    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-diagnosis`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketProductPrescription(body: {
    ticketId: number
    ticketProductPrescriptionList?: TicketProduct[]
    ticketAttributeChangeList?: { key: string; value: any }[]
    ticketAttributeKeyList: string[]
  }) {
    const {
      ticketId,
      ticketProductPrescriptionList,
      ticketAttributeChangeList,
      ticketAttributeKeyList,
    } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-product-prescription`,
      {
        ticketProductPrescriptionList: ticketProductPrescriptionList
          ? ticketProductPrescriptionList.map((i) => ({
              productId: i.productId,
              batchId: i.batchId,
              warehouseId: i.warehouseId,
              unitRate: i.unitRate,
              quantityPrescription: i.quantityPrescription,
              quantity: i.quantity,
              costPrice: i.costPrice,
              expectedPrice: i.expectedPrice,
              discountMoney: i.discountMoney,
              discountPercent: i.discountPercent,
              discountType: i.discountType,
              actualPrice: i.actualPrice,
              hintUsage: i.hintUsage,
            }))
          : undefined,
        ticketAttributeKeyList: ticketAttributeKeyList || undefined,
        ticketAttributeChangeList:
          ticketAttributeChangeList?.map((i) => {
            return { key: i.key, value: i.value }
          }) || undefined,
      }
    )
    const { data } = response.data as BaseResponse<boolean>
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

  static async destroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-clinic/${ticketId}/destroy`)
    const { data } = response.data as BaseResponse<{ ticketId: any }>
    return data
  }
}
