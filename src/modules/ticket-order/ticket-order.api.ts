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
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i, index) => ({
        priority: index + 1,
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
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i, index) => ({
        priority: index + 1,
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
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i, index) => ({
        priority: index + 1,
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
      { money }
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
    const { data } = response.data as BaseResponse<{ ticket: any; customerPayment: any }>
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

  static async returnProduct(options: {
    ticketId: number
    ticketProductReturnList: {
      ticketProductId: number
      quantityReturn: number
    }[]
    ticketProcedureReturnList: {
      ticketProcedureId: number
      quantityReturn: number
    }[]
    itemsCostAmountUpdate: number
    productMoneyUpdate: number
    procedureMoneyUpdate: number
    itemsActualMoneyUpdate: number
    itemsDiscountUpdate: number

    discountMoneyUpdate: number
    discountPercentUpdate: number
    surchargeUpdate: number
    expenseUpdate: number

    totalMoneyUpdate: number
    profitUpdate: number
    paidUpdate: number
    debtUpdate: number
  }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/return-product`, {
      ticketProductReturnList: options.ticketProductReturnList.map((i) => ({
        ticketProductId: i.ticketProductId,
        quantityReturn: i.quantityReturn,
      })),
      ticketProcedureReturnList: options.ticketProcedureReturnList.map((i) => ({
        ticketProcedureId: i.ticketProcedureId,
        quantityReturn: i.quantityReturn,
      })),
      itemsCostAmountUpdate: options.itemsCostAmountUpdate,
      productMoneyUpdate: options.productMoneyUpdate,
      procedureMoneyUpdate: options.procedureMoneyUpdate,
      itemsActualMoneyUpdate: options.itemsActualMoneyUpdate,
      itemsDiscountUpdate: options.itemsDiscountUpdate,

      discountMoneyUpdate: options.discountMoneyUpdate,
      discountPercentUpdate: options.discountPercentUpdate,
      surchargeUpdate: options.surchargeUpdate,
      expenseUpdate: options.expenseUpdate,

      totalMoneyUpdate: options.totalMoneyUpdate,
      profitUpdate: options.profitUpdate,
      paidUpdate: options.paidUpdate,
      debtUpdate: options.debtUpdate,
    })
    const { data } = response.data as BaseResponse<{
      ticket: any
      ticketProductList: any[]
      ticketProcedureList: any[]
      customerPayment?: any
    }>
    return {
      ticket: Ticket.from(data.ticket),
      customerPayment: data.customerPayment ? CustomerPayment.from(data.customerPayment) : null,
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
      customerPayment: any
      customer: any
    }>
    return {
      ticket: Ticket.from(data.ticket),
      customerPayment: data.customerPayment ? CustomerPayment.from(data.customerPayment) : null,
    }
  }

  static async destroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-order/${ticketId}/destroy`)
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }
}
