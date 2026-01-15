import { AxiosInstance } from '../../../core/axios.instance'
import type { FullResponse } from '../../_base/base-dto'
import { Payment } from '../../payment'
import { TicketProduct } from '../../ticket-product'
import { Ticket } from '../ticket.model'

export class TicketOrderApi {
  static generateTicketOrderBasic(ticket: Ticket) {
    return {
      ticketOrderBasic: {
        roomId: ticket.roomId,
        procedureMoney: ticket.procedureMoney,
        productMoney: ticket.productMoney,
        itemsActualMoney: ticket.itemsActualMoney,
        itemsDiscount: ticket.itemsDiscount,
        discountMoney: ticket.discountMoney,
        discountPercent: ticket.discountPercent,
        discountType: ticket.discountType,
        surcharge: ticket.surcharge,
        totalMoney: ticket.totalMoney,
        expense: ticket.expense,
        // profit: ticket.profit,
        createdAt: ticket.createdAt,
        note: ticket.note || '',
      },
      ticketOrderProductBodyList: (ticket.ticketProductList || []).map((i, index) => ({
        priority: index + 1,
        pickupStrategy: i.pickupStrategy,
        warehouseIds: i.warehouseIds,
        productId: i.productId,
        batchId: i.batchId,
        unitRate: i.unitRate,
        unitQuantity: i.unitQuantity,
        unitExpectedPrice: i.unitExpectedPrice,
        unitDiscountMoney: i.unitDiscountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        unitActualPrice: i.unitActualPrice,
        hintUsage: i.hintUsage,
      })),
      ticketOrderProcedureBodyList: (ticket.ticketProcedureList || []).map((i, index) => ({
        priority: index + 1,
        procedureId: i.procedureId,
        quantity: i.quantity,
        expectedPrice: i.expectedPrice,
        discountMoney: i.discountMoney,
        discountPercent: i.discountPercent,
        discountType: i.discountType,
        actualPrice: i.actualPrice,
      })),
      ticketOrderSurchargeBodyList: (ticket.ticketSurchargeList || [])
        .filter((i) => i.money != 0)
        .map((i) => ({
          surchargeId: i.surchargeId,
          money: i.money,
        })),
      ticketOrderExpenseBodyList: (ticket.ticketExpenseList || [])
        .filter((i) => i.money != 0)
        .map((i) => ({
          expenseId: i.expenseId,
          money: i.money,
        })),
      ticketOrderAttributeDaftList: (ticket.ticketAttributeList || []).map((i) => {
        return { key: i.key, value: i.value }
      }),
    }
  }

  static async draftInsert(options: { ticket: Ticket }) {
    const { ticket } = options
    const ticketOrderBasicBody = TicketOrderApi.generateTicketOrderBasic(ticket)
    const response = await AxiosInstance.post('/ticket/order/draft-insert', {
      ...ticketOrderBasicBody,
      customerId: ticket.customerId,
    })
    const { data } = response.data as FullResponse<{ ticketCreated: any }>
    return Ticket.from(data.ticketCreated)
  }

  static async draftUpdate(options: { ticketId: string; ticket: Ticket }) {
    const { ticketId, ticket } = options
    const ticketOrderBasicBody = TicketOrderApi.generateTicketOrderBasic(ticket)
    const response = await AxiosInstance.post(`/ticket/order/${ticketId}/draft-update`, {
      ...ticketOrderBasicBody,
    })
    const { data } = response.data as FullResponse<{ ticketModified: any }>
    return Ticket.from(data.ticketModified)
  }

  static async depositedUpdate(options: { ticketId: string; ticket: Ticket }) {
    const { ticketId, ticket } = options
    const ticketOrderBasicBody = TicketOrderApi.generateTicketOrderBasic(ticket)
    const response = await AxiosInstance.post(`/ticket/order/${ticketId}/deposited-update`, {
      ...ticketOrderBasicBody,
    })
    const { data } = response.data as FullResponse<{ ticketModified: any }>
    return Ticket.from(data.ticketModified)
  }

  static async debtSuccessCreate(options: { ticket: Ticket; walletId: string }) {
    const { ticket, walletId } = options
    const ticketOrderBasicBody = TicketOrderApi.generateTicketOrderBasic(ticket)
    const response = await AxiosInstance.post('/ticket/order/debt-success-create', {
      ...ticketOrderBasicBody,
      customerId: ticket.customerId,
      walletId,
      paidTotal: ticket.paidTotal,
    })
    const { data } = response.data as FullResponse<{ ticketCreated: any }>
    return Ticket.from(data.ticketCreated)
  }

  static async debtSuccessUpdate(options: { ticketId: string; ticket: Ticket; walletId: string }) {
    const { ticket, ticketId, walletId } = options
    const ticketOrderBasicBody = TicketOrderApi.generateTicketOrderBasic(ticket)
    const response = await AxiosInstance.post(`/ticket/order/${ticketId}/debt-success-update`, {
      ...ticketOrderBasicBody,
      walletId,
      paidTotal: ticket.paidTotal,
    })
    const { data } = response.data as FullResponse<{ ticketModified: any }>
    return Ticket.from(data.ticketModified)
  }

  // ================= ACTION ================= //
  static async destroy(ticketId: string) {
    const response = await AxiosInstance.post(`/ticket/order/${ticketId}/destroy`)
    const { data } = response.data as FullResponse<{ ticketId: string }>
    return data
  }

  static async sendProductAndPaymentAndClose(
    ticketId: string,
    body: {
      paidAmount: number
      customerId: number
      walletId: string
      note: string
      ticketProductIdList: number[]
    },
  ) {
    const response = await AxiosInstance.post(
      `/ticket/order/${ticketId}/send-product-and-payment-and-close`,
      body,
    )
    const { data } = response.data as FullResponse<{
      ticketModified: any
      paymentCreatedList: any[]
      ticketProductModifiedAll?: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      paymentCreatedList: Payment.fromList(data.paymentCreatedList),
      ticketProductModifiedAll: data.ticketProductModifiedAll
        ? TicketProduct.fromList(data.ticketProductModifiedAll)
        : undefined,
    }
  }
}
