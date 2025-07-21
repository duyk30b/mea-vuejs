import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { PaymentItem } from '../payment-item'
import { TicketProduct } from '../ticket-product'
import { Ticket } from '../ticket/ticket.model'

export class TicketOrderApi {
  static async draftUpsert(options: { ticketId: number; ticket: Ticket }) {
    const { ticketId, ticket } = options
    const response = await AxiosInstance.post('/ticket-order/draft-upsert', {
      ticketId,
      ticketOrderDraftUpsert: {
        customerId: ticket.customerId,
        itemsCostAmount: ticket.itemsCostAmount,
        procedureMoney: ticket.procedureMoney,
        productMoney: ticket.productMoney,
        itemsActualMoney: ticket.itemsActualMoney,
        itemsDiscount: ticket.itemsDiscount,
        discountMoney: ticket.discountMoney,
        discountPercent: ticket.discountPercent,
        discountType: ticket.discountType,
        surcharge: ticket.surcharge,
        totalMoney: ticket.totalMoney,
        // paid: ticket.paid, // nháp ko gửi paid và debt
        // debt: ticket.debt, // nháp ko gửi paid và debt
        expense: ticket.expense,
        profit: ticket.profit,
        registeredAt: ticket.registeredAt,
        note: ticket.note || '',
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i, index) => ({
        priority: index + 1,
        pickupStrategy: i.pickupStrategy,
        warehouseIds: i.warehouseIds,
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
        hintUsage: i.hintUsage,
      })),
      ticketOrderProcedureDraftList: (ticket.ticketProcedureList || []).map((i, index) => ({
        priority: index + 1,
        procedureId: i.procedureId,
        quantity: i.quantity,
        expectedPrice: i.expectedPrice,
        discountMoney: i.discountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        actualPrice: i.actualPrice,
      })),
      ticketOrderSurchargeDraftList: (ticket.ticketSurchargeList || []).map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
      ticketOrderExpenseDraftList: ticket.ticketExpenseList?.map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
      // ticketOrderAttributeDaftList: ticket.ticketAttributeList?.map((i) => {
      //   return { key: i.key, value: i.value }
      // }),
    })
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return Ticket.from(data.ticket)
  }

  static async depositedUpdate(options: { ticketId: number; ticket: Ticket }) {
    const { ticketId, ticket } = options
    const response = await AxiosInstance.patch(`/ticket-order/${ticketId}/deposited-update`, {
      ticketOrderDraftApprovedUpdate: {
        itemsCostAmount: ticket.itemsCostAmount,
        procedureMoney: ticket.procedureMoney,
        productMoney: ticket.productMoney,
        itemsActualMoney: ticket.itemsActualMoney,
        itemsDiscount: ticket.itemsDiscount,
        discountMoney: ticket.discountMoney,
        discountPercent: ticket.discountPercent,
        discountType: ticket.discountType,
        surcharge: ticket.surcharge,
        totalMoney: ticket.totalMoney,
        // paid: ticket.paid, // nháp ko gửi paid và debt
        // debt: ticket.debt, // nháp ko gửi paid và debt
        expense: ticket.expense,
        profit: ticket.profit,
        registeredAt: ticket.registeredAt,
        note: ticket.note || '',
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i, index) => ({
        priority: index + 1,
        pickupStrategy: i.pickupStrategy,
        warehouseIds: i.warehouseIds,
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
        hintUsage: i.hintUsage,
      })),
      ticketOrderProcedureDraftList: (ticket.ticketProcedureList || []).map((i, index) => ({
        priority: index + 1,
        procedureId: i.procedureId,
        quantity: i.quantity,
        expectedPrice: i.expectedPrice,
        discountMoney: i.discountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        actualPrice: i.actualPrice,
      })),
      ticketOrderSurchargeDraftList: (ticket.ticketSurchargeList || []).map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
      ticketOrderExpenseDraftList: ticket.ticketExpenseList?.map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
      // ticketOrderAttributeDaftList: ticket.ticketAttributeList?.map((i) => {
      //   return { key: i.key, value: i.value }
      // }),
    })
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return Ticket.from(data.ticket)
  }

  static async debtSuccessCreate(options: { ticket: Ticket }) {
    const { ticket } = options
    const response = await AxiosInstance.post('/ticket-order/debt-success-create', {
      ticketOrderDebtSuccessInsert: {
        customerId: ticket.customerId,
        itemsCostAmount: ticket.itemsCostAmount,
        procedureMoney: ticket.procedureMoney,
        productMoney: ticket.productMoney,
        // radiologyMoney: ticket.radiologyMoney,
        itemsActualMoney: ticket.itemsActualMoney,
        itemsDiscount: ticket.itemsDiscount,
        discountMoney: ticket.discountMoney,
        discountPercent: ticket.discountPercent,
        discountType: ticket.discountType,
        surcharge: ticket.surcharge,
        totalMoney: ticket.totalMoney,
        paid: ticket.paid, // close gửi thêm giá trị paid
        // debt: ticket.debt, // backend tự tính
        expense: ticket.expense,
        profit: ticket.profit,
        registeredAt: ticket.registeredAt,
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i, index) => ({
        priority: index + 1,
        pickupStrategy: i.pickupStrategy,
        warehouseIds: i.warehouseIds,
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
        hintUsage: i.hintUsage,
      })),
      ticketOrderProcedureDraftList: (ticket.ticketProcedureList || []).map((i, index) => ({
        priority: index + 1,
        procedureId: i.procedureId,
        quantity: i.quantity,
        expectedPrice: i.expectedPrice,
        discountMoney: i.discountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        actualPrice: i.actualPrice,
      })),
      ticketOrderSurchargeDraftList: (ticket.ticketSurchargeList || []).map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
      ticketOrderExpenseDraftList: ticket.ticketExpenseList?.map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
      ticketOrderAttributeDaftList: ticket.ticketAttributeList?.map((i) => {
        return { key: i.key, value: i.value }
      }),
    })
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return Ticket.from(data.ticket)
  }

  static async debtSuccessUpdate(options: { ticketId: number; ticket: Ticket }) {
    const { ticket, ticketId } = options
    const response = await AxiosInstance.patch(`/ticket-order/${ticketId}/debt-success-update`, {
      ticketOrderDebtSuccessUpdate: {
        // customerId: ticket.customerId, // không cho thay đổi customerID
        itemsCostAmount: ticket.itemsCostAmount,
        procedureMoney: ticket.procedureMoney,
        productMoney: ticket.productMoney,
        // radiologyMoney: ticket.radiologyMoney,
        itemsActualMoney: ticket.itemsActualMoney,
        itemsDiscount: ticket.itemsDiscount,
        discountMoney: ticket.discountMoney,
        discountPercent: ticket.discountPercent,
        discountType: ticket.discountType,
        surcharge: ticket.surcharge,
        totalMoney: ticket.totalMoney,
        paid: ticket.paid, // close gửi thêm giá trị paid
        // debt: ticket.debt, // backend tự tính
        expense: ticket.expense,
        profit: ticket.profit,
        registeredAt: ticket.registeredAt,
        note: ticket.note,
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i, index) => ({
        priority: index + 1,
        pickupStrategy: i.pickupStrategy,
        warehouseIds: i.warehouseIds,
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
        hintUsage: i.hintUsage,
      })),
      ticketOrderProcedureDraftList: (ticket.ticketProcedureList || []).map((i, index) => ({
        priority: index + 1,
        procedureId: i.procedureId,
        quantity: i.quantity,
        expectedPrice: i.expectedPrice,
        discountMoney: i.discountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        actualPrice: i.actualPrice,
      })),
      ticketOrderSurchargeDraftList: (ticket.ticketSurchargeList || []).map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
      ticketOrderExpenseDraftList: ticket.ticketExpenseList?.map((i) => ({
        key: i.key,
        name: i.name,
        money: i.money,
      })),
      // ticketOrderAttributeDaftList: ticket.ticketAttributeList?.map((i) => {
      //   return { key: i.key, value: i.value }
      // }),
    })
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }

  // ================= ACTION ================= //
  static async draftDestroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-order/${ticketId}/draft-destroy`)
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }

  static async depositedDestroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-order/${ticketId}/deposited-destroy`)
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }

  static async cancelledDestroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-order/${ticketId}/cancelled-destroy`)
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }

  static async sendProductAndPaymentAndClose(
    ticketId: number,
    body: {
      money: number
      customerId: number
      paymentMethodId: number
      reason: string
      ticketProductIdList: number[]
    },
  ) {
    const response = await AxiosInstance.post(
      `/ticket-order/${ticketId}/send-product-and-payment-and-close`,
      body,
    )
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      paymentItemCreatedList: any[]
      ticketProductModifiedAll?: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      paymentItemCreatedList: PaymentItem.fromList(data.paymentItemCreatedList),
      ticketProductModifiedAll: data.ticketProductModifiedAll
        ? TicketProduct.fromList(data.ticketProductModifiedAll)
        : undefined,
    }
  }
}
