import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Payment } from '../payment/payment.model'
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

  static async sendProductAndPaymentAndClose(options: {
    ticketId: number
    money: number
    paymentMethodId: number
    note: string
  }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(
      `/ticket-order/${ticketId}/send-product-and-payment-and-close`,
      {
        money: options.money,
        paymentMethodId: options.paymentMethodId,
        note: options.note,
      },
    )
    const { data } = response.data as BaseResponse<{
      ticket: any
      ticketProductList: any[]
      payment?: any
    }>
    return {
      ticket: Ticket.from(data.ticket),
      ticketProductList: TicketProduct.fromList(data.ticketProductList),
      payment: data.payment ? Payment.from(data.payment) : null,
    }
  }

  static async prepayment(body: {
    ticketId: number
    money: number
    note: string
    paymentMethodId: number
  }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/prepayment`, {
      money: body.money,
      note: body.note,
      paymentMethodId: body.paymentMethodId,
    })
    const { data } = response.data as BaseResponse<{ ticket: any; payment?: any }>
    return {
      ticket: Ticket.from(data.ticket),
      payment: data.payment ? Payment.from(data.payment) : null,
    }
  }

  static async sendProduct(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/send-product`)
    const { data } = response.data as BaseResponse<{
      ticket: any
      ticketProductList: any[]
    }>
    return {
      ticket: Ticket.from(data.ticket),
      ticketProductList: TicketProduct.fromList(data.ticketProductList),
    }
  }

  static async close(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/close`)
    const { data } = response.data as BaseResponse<{ ticket: any; payment?: any }>
    return {
      ticket: Ticket.from(data.ticket),
      payment: data.payment ? Payment.from(data.payment) : null,
    }
  }

  static async refundOverpaid(options: {
    ticketId: number
    money: number
    note: string
    paymentMethodId: number
  }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/refund-overpaid`, {
      money: options.money,
      note: options.note,
      paymentMethodId: options.paymentMethodId,
    })
    const { data } = response.data as BaseResponse<{ ticket: any; payment: any }>
    return {
      ticket: Ticket.from(data.ticket),
      payment: data.payment ? Payment.from(data.payment) : null,
    }
  }

  static async returnProduct(body: {
    ticketId: number
    returnList: {
      ticketBatchId: number
      quantityReturn: number
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

  static async payDebt(options: {
    ticketId: number
    money: number
    note: string
    paymentMethodId: number
  }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/pay-debt`, {
      money: options.money,
      note: options.note,
      paymentMethodId: options.paymentMethodId,
    })
    const { data } = response.data as BaseResponse<{ ticket: any; payment: any }>
    return {
      ticket: Ticket.from(data.ticket),
      payment: data.payment ? Payment.from(data.payment) : null,
    }
  }

  static async terminate(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/terminate`)
    const { data } = response.data as BaseResponse<{
      ticket: any
      paymentList: any
      customer?: any
      ticketProductList?: any[]
    }>
    return {
      ticket: Ticket.from(data.ticket),
      paymentList: Payment.fromList(data.paymentList),
      ticketProductList: data.ticketProductList
        ? TicketProduct.fromList(data.ticketProductList)
        : null,
    }
  }
}
