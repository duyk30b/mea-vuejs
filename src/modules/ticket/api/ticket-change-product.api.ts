import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { TicketProduct } from '../../ticket-product'
import type { TicketUser } from '../../ticket-user'

export class TicketChangeProductApi {
  static async addTicketProductList(body: {
    ticketId: number
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/product/add-ticket-product-list`,
      {
        ticketProductList: ticketProductList.map((i) => ({
          priority: i.priority,
          warehouseIds: i.warehouseIds,
          productId: i.productId,
          batchId: i.batchId,

          pickupStrategy: i.pickupStrategy,
          paymentMoneyStatus: i.paymentMoneyStatus,

          unitRate: i.unitRate,
          quantityPrescription: i.quantityPrescription,
          printPrescription: i.printPrescription,
          quantity: i.quantity,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          costAmount: i.costAmount,
          actualPrice: i.actualPrice,

          createdAt: i.createdAt,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async addTicketProductConsumableList(body: {
    ticketId: number
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
          paymentMoneyStatus: i.paymentMoneyStatus,

          unitRate: i.unitRate,
          quantityPrescription: i.quantityPrescription,
          printPrescription: i.printPrescription,
          quantity: i.quantity,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          costAmount: i.costAmount,
          actualPrice: i.actualPrice,

          createdAt: i.createdAt,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async addTicketProductPrescriptionList(body: {
    ticketId: number
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
          paymentMoneyStatus: i.paymentMoneyStatus,

          unitRate: i.unitRate,
          quantityPrescription: i.quantityPrescription,
          printPrescription: i.printPrescription,
          quantity: i.quantity,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
          costAmount: i.costAmount,

          hintUsage: i.hintUsage,
          createdAt: i.createdAt,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketProduct(body: { ticketId: number; ticketProductId: number }) {
    const { ticketId, ticketProductId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/product/destroy-ticket-product/${ticketProductId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketProductConsumable(body: { ticketId: number; ticketProductId: number }) {
    const { ticketId, ticketProductId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/consumable/destroy-ticket-product-consumable/${ticketProductId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketProductPrescription(body: {
    ticketId: number
    ticketProductId: number
  }) {
    const { ticketId, ticketProductId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/prescription/destroy-ticket-product-prescription/${ticketProductId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updatePriorityTicketProduct(body: {
    ticketId: number
    ticketProductList: TicketProduct[]
  }) {
    const { ticketId, ticketProductList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/product/update-priority-ticket-product`,
      {
        ticketProductList: ticketProductList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updatePriorityTicketProductConsumable(body: {
    ticketId: number
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
    ticketId: number
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

  static async updateTicketProduct(body: {
    ticketId: number
    ticketProductId: number
    ticketProduct?: TicketProduct
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketProduct, ticketProductId, ticketUserList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/product/update-ticket-product/${ticketProductId}`,
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
            costAmount: ticketProduct.costAmount,
            actualPrice: ticketProduct.actualPrice,
            hintUsage: ticketProduct.hintUsage,
          }
          : undefined,
        ticketUserList: ticketUserList
          ? ticketUserList.map((i) => ({
            id: i.id || 0,
            roleId: i.roleId || 0,
            userId: i.userId || 0,
          }))
          : undefined,
      },
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
            costAmount: ticketProduct.costAmount,
            actualPrice: ticketProduct.actualPrice,
            hintUsage: ticketProduct.hintUsage,
          }
          : undefined,
        ticketUserList: ticketUserList
          ? ticketUserList.map((i) => ({
            id: i.id || 0,
            roleId: i.roleId || 0,
            userId: i.userId || 0,
          }))
          : undefined,
      },
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
            costAmount: ticketProduct.costAmount,
            actualPrice: ticketProduct.actualPrice,
            hintUsage: ticketProduct.hintUsage,
          }
          : undefined,
        ticketUserList: ticketUserList
          ? ticketUserList.map((i) => ({
            id: i.id || 0,
            roleId: i.roleId || 0,
            userId: i.userId || 0,
          }))
          : undefined,
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }
}
