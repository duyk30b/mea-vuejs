import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { CustomerPayment } from '../customer-payment/customer-payment.model'
import { TicketProduct } from '../ticket-product'
import { Ticket } from '../ticket/ticket.model'

export class TicketOrderApi {
  static async createDraft(options: { ticket: Ticket }) {
    const { ticket } = options
    const response = await AxiosInstance.post('/ticket-order/create-draft', {
      ticketOrderDraftInsert: {
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
        inventoryStrategy: i.inventoryStrategy,
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

  static async updateDraftApproved(options: { ticketId: number; ticket: Ticket }) {
    const { ticketId, ticket } = options
    const response = await AxiosInstance.patch(`/ticket-order/${ticketId}/update-draft-approved`, {
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
        inventoryStrategy: i.inventoryStrategy,
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

  static async createDebtSuccess(options: { ticket: Ticket }) {
    const { ticket } = options
    const response = await AxiosInstance.post('/ticket-order/create-debt-success', {
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
        inventoryStrategy: i.inventoryStrategy,
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

  static async updateDebtSuccess(options: { ticketId: number; ticket: Ticket }) {
    const { ticket, ticketId } = options
    const response = await AxiosInstance.patch(`/ticket-order/${ticketId}/update-debt-success`, {
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
        inventoryStrategy: i.inventoryStrategy,
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

  static async prepayment(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/prepayment`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ ticket: any; customerPayment: any }>
    return {
      ticket: Ticket.from(data.ticket),
      customerPayment: CustomerPayment.from(data.customerPayment),
    }
  }

  static async sendProductAndPaymentAndClose(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(
      `/ticket-order/${ticketId}/send-product-and-payment-and-close`,
      { money },
    )
    const { data } = response.data as BaseResponse<{
      ticket: any
      ticketProductList: any[]
      customerPayment?: any
    }>
    return {
      ticket: Ticket.from(data.ticket),
      ticketProductList: TicketProduct.fromList(data.ticketProductList),
      customerPayment: data.customerPayment ? CustomerPayment.from(data.customerPayment) : null,
    }
  }

  static async paymentAndClose(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/payment-and-close`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ ticket: any; customerPayment?: any }>
    return {
      ticket: Ticket.from(data.ticket),
      customerPayment: data.customerPayment ? CustomerPayment.from(data.customerPayment) : null,
    }
  }

  static async refundOverpaid(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/refund-overpaid`, {
      money,
    })
    const { data } = response.data as BaseResponse<{
      ticket: any

      customerPayment: any
    }>
    return {
      ticket: Ticket.from(data.ticket),
      customerPayment: CustomerPayment.from(data.customerPayment),
    }
  }

  static async sendProduct(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/send-product`)
    const { data } = response.data as BaseResponse<{
      ticket: any
      ticketProductList: any[]
      customerPayment: any
    }>
    return {
      ticket: Ticket.from(data.ticket),
      ticketProductList: TicketProduct.fromList(data.ticketProductList),
    }
  }

  static async returnProduct(body: {
    ticketId: number
    returnList: {
      ticketBatchId: number
      quantity: number
    }[]
  }) {
    const { ticketId, returnList } = body
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/return-product`, {
      returnList,
    })
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return {
      ticket: Ticket.from(data.ticket),
    }
  }

  static async payDebt(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/pay-debt`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ ticket: any; customerPayment: any }>
    return {
      ticket: Ticket.from(data.ticket),
      customerPayment: CustomerPayment.from(data.customerPayment),
    }
  }

  static async cancel(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/cancel`)
    const { data } = response.data as BaseResponse<{
      ticket: any
      customerPaymentList: any
      customer: any
    }>
    return {
      ticket: Ticket.from(data.ticket),
      customerPaymentList: CustomerPayment.fromList(data.customerPaymentList),
    }
  }

  static async destroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-order/${ticketId}/destroy`)
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }
}
