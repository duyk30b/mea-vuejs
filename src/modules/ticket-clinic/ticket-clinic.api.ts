import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { Customer } from '../customer'
import type { DiscountType } from '../enum'
import type { TicketLaboratory } from '../ticket-laboratory'
import { TicketProcedure } from '../ticket-procedure'
import type { TicketProduct } from '../ticket-product'
import type { TicketRadiology } from '../ticket-radiology'
import type { TicketUser } from '../ticket-user'
import { Ticket, TicketStatus, type TicketType } from '../ticket/ticket.model'

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

  static async updateTicketLaboratoryList(body: {
    ticketId: number
    customerId: number
    ticketLaboratoryList: TicketLaboratory[]
  }) {
    const { ticketId, customerId, ticketLaboratoryList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-laboratory-list`,
      {
        customerId: customerId,
        ticketLaboratoryList: ticketLaboratoryList.map((i) => {
          const plain: { [P in keyof TicketLaboratory]?: any } = {}
          plain.laboratoryId = i.laboratoryId
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
          warehouseId: i.warehouseId,
          unitRate: i.unitRate,
          quantity: i.quantity,
          costPrice: i.costPrice,
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

  static async updateItemsMoney(body: {
    ticketId: number
    itemsActualMoney: number
    discountMoney: number
    discountPercent: number
    discountType: DiscountType
    ticketProductList: TicketProduct[]
    ticketProcedureList: TicketProcedure[]
    ticketLaboratoryList: TicketLaboratory[]
    ticketRadiologyList: TicketRadiology[]
  }) {
    const {
      ticketId,
      ticketProductList,
      ticketProcedureList,
      ticketRadiologyList,
      ticketLaboratoryList,
    } = body

    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/update-items-money`, {
      itemsActualMoney: body.itemsActualMoney,
      // itemsDiscount: body.itemsDiscount, // itemDiscount bị thay đổi khi thêm dịch vụ mà ko tính toán được, nên đợi đóng phiếu mới tính
      discountMoney: body.discountMoney,
      discountPercent: body.discountPercent,
      discountType: body.discountType,
      ticketProductUpdateList: ticketProductList.map((item) => {
        return {
          ticketProductId: item.id,
          quantity: item.quantity,
          discountMoney: item.discountMoney,
          discountPercent: item.discountPercent,
          discountType: item.discountType,
          actualPrice: item.actualPrice,
        }
      }),
      ticketProcedureUpdateList: ticketProcedureList.map((item) => {
        return {
          ticketProcedureId: item.id,
          discountMoney: item.discountMoney,
          discountPercent: item.discountPercent,
          discountType: item.discountType,
          actualPrice: item.actualPrice,
        }
      }),
      ticketLaboratoryUpdateList: ticketLaboratoryList.map((item) => {
        return {
          ticketLaboratoryId: item.id,
          discountMoney: item.discountMoney,
          discountPercent: item.discountPercent,
          discountType: item.discountType,
          actualPrice: item.actualPrice,
        }
      }),
      ticketRadiologyUpdateList: ticketRadiologyList.map((item) => {
        return {
          ticketRadiologyId: item.id,
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
