import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { TicketProduct } from '../ticket-product'
import type { TicketUser } from '../ticket-user'

export class TicketClinicProductApi {
  static async addTicketProductConsumableList(body: {
    ticketId: number
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/add-ticket-product-consumable-list`,
      {
        ticketProductList: ticketProductList.map((i) => ({
          priority: i.priority,
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
        })),
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async addTicketProductPrescriptionList(body: {
    ticketId: number
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/add-ticket-product-prescription-list`,
      {
        ticketProductList: ticketProductList.map((i) => ({
          priority: i.priority,
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
        })),
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketProductConsumable(body: { ticketId: number; ticketProductId: number }) {
    const { ticketId, ticketProductId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-product-consumable/${ticketProductId}`
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketProductPrescription(body: {
    ticketId: number
    ticketProductId: number
  }) {
    const { ticketId, ticketProductId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-product-prescription/${ticketProductId}`
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updatePriorityTicketProductConsumable(body: {
    ticketId: number
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-priority-ticket-product-consumable`,
      {
        ticketProductList: ticketProductList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updatePriorityTicketProductPrescription(body: {
    ticketId: number
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-priority-ticket-product-prescription`,
      {
        ticketProductList: ticketProductList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketProductConsumable(body: {
    ticketId: number
    ticketProductId: number
    ticketProduct?: TicketProduct
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketProduct, ticketProductId, ticketUserList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-product-consumable/${ticketProductId}`,
      {
        ticketProduct: ticketProduct
          ? {
              quantity: ticketProduct.quantity,
              quantityPrescription: ticketProduct.quantityPrescription,
              expectedPrice: ticketProduct.expectedPrice,
              discountType: ticketProduct.discountType,
              discountMoney: ticketProduct.discountMoney,
              discountPercent: ticketProduct.discountPercent,
              actualPrice: ticketProduct.actualPrice,
              hintUsage: ticketProduct.hintUsage,
            }
          : undefined,
        ticketUserList: ticketUserList
          ? ticketUserList.map((i) => ({
              roleId: i.roleId || 0,
              userId: i.userId || 0,
            }))
          : undefined,
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketProductPrescription(body: {
    ticketId: number
    ticketProductId: number
    ticketProduct?: TicketProduct
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketProduct, ticketProductId, ticketUserList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-product-prescription/${ticketProductId}`,
      {
        ticketProduct: ticketProduct
          ? {
              quantity: ticketProduct.quantity,
              quantityPrescription: ticketProduct.quantityPrescription,
              expectedPrice: ticketProduct.expectedPrice,
              discountType: ticketProduct.discountType,
              discountMoney: ticketProduct.discountMoney,
              discountPercent: ticketProduct.discountPercent,
              actualPrice: ticketProduct.actualPrice,
              hintUsage: ticketProduct.hintUsage,
            }
          : undefined,
        ticketUserList: ticketUserList
          ? ticketUserList.map((i) => ({
              roleId: i.roleId || 0,
              userId: i.userId || 0,
            }))
          : undefined,
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async sendProduct(body: { ticketId: number }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/send-product`)
    const { data } = response.data as BaseResponse
  }
}
