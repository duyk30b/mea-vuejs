import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { TicketProduct } from '../../ticket-product'
import type { TicketUser } from '../../ticket-user'

export class TicketChangeProductApi {
  static async addTicketProductConsumableList(body: {
    ticketId: string
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/consumable/add-ticket-product-consumable-list`,
      {
        ticketProductList: ticketProductList.map((i) => ({
          priority: i.priority,
          warehouseIds: i.warehouseIds,
          productId: i.productId,
          batchId: i.batchId,

          pickupStrategy: i.pickupStrategy,

          unitRate: i.unitRate,
          quantityPrescription: i.quantityPrescription,
          printPrescription: i.printPrescription,
          quantity: i.quantity,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,

          createdAt: i.createdAt,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async addTicketProductPrescriptionList(body: {
    ticketId: string
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/prescription/add-ticket-product-prescription-list`,
      {
        ticketProductList: ticketProductList.map((i) => ({
          priority: i.priority,
          warehouseIds: i.warehouseIds,
          productId: i.productId,
          batchId: i.batchId,

          pickupStrategy: i.pickupStrategy,

          unitRate: i.unitRate,
          quantityPrescription: i.quantityPrescription,
          printPrescription: i.printPrescription,
          quantity: i.quantity,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,

          hintUsage: i.hintUsage,
          createdAt: i.createdAt,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketProductConsumable(body: { ticketId: string; ticketProductId: string }) {
    const { ticketId, ticketProductId } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/consumable/destroy-ticket-product-consumable/${ticketProductId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketProductPrescription(body: {
    ticketId: string
    ticketProductId: string
  }) {
    const { ticketId, ticketProductId } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/prescription/destroy-ticket-product-prescription/${ticketProductId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updatePriorityTicketProductConsumable(body: {
    ticketId: string
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/consumable/update-priority-ticket-product-consumable`,
      {
        ticketProductList: ticketProductList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updatePriorityTicketProductPrescription(body: {
    ticketId: string
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/prescription/update-priority-ticket-product-prescription`,
      {
        ticketProductList: ticketProductList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketProductConsumable(body: {
    ticketId: string
    ticketProductId: string
    ticketProduct?: TicketProduct
    ticketUserRequestList?: TicketUser[]
  }) {
    const { ticketId, ticketProduct, ticketProductId, ticketUserRequestList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/consumable/update-ticket-product-consumable/${ticketProductId}`,
      {
        ticketProduct: ticketProduct
          ? {
            quantity: ticketProduct.quantity,
            quantityPrescription: ticketProduct.quantityPrescription,
            printPrescription: ticketProduct.printPrescription,
            expectedPrice: ticketProduct.expectedPrice,
            discountType: ticketProduct.discountType,
            discountMoney: ticketProduct.discountMoney,
            discountPercent: ticketProduct.discountPercent,
            actualPrice: ticketProduct.actualPrice,
            hintUsage: ticketProduct.hintUsage,
          }
          : undefined,
        ticketUserRequestList: ticketUserRequestList
          ? ticketUserRequestList
            .filter((i) => !!i.userId)
            .map((i) => ({
              positionId: i.positionId,
              userId: i.userId,
            }))
          : undefined,
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketProductPrescription(body: {
    ticketId: string
    ticketProductId: string
    ticketProduct?: TicketProduct
    ticketUserRequestList?: TicketUser[]
  }) {
    const { ticketId, ticketProduct, ticketProductId, ticketUserRequestList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/prescription/update-ticket-product-prescription/${ticketProductId}`,
      {
        ticketProduct: ticketProduct
          ? {
            quantity: ticketProduct.quantity,
            quantityPrescription: ticketProduct.quantityPrescription,
            printPrescription: ticketProduct.printPrescription,
            expectedPrice: ticketProduct.expectedPrice,
            discountType: ticketProduct.discountType,
            discountMoney: ticketProduct.discountMoney,
            discountPercent: ticketProduct.discountPercent,
            actualPrice: ticketProduct.actualPrice,
            hintUsage: ticketProduct.hintUsage,
          }
          : undefined,
        ticketUserRequestList: ticketUserRequestList
          ? ticketUserRequestList
            .filter((i) => !!i.userId)
            .map((i) => ({
              positionId: i.positionId,
              userId: i.userId,
            }))
          : undefined,
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }
}
