import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Ticket } from './ticket.model'

export class TicketOrderBasicApi {
  static async createDraft(ticket: Ticket) {
    const response = await AxiosInstance.post('/ticket-order/create-draft', {
      ticketOrderDraftInsert: {
        customerId: ticket.customerId,
        totalCostAmount: ticket.totalCostAmount,
        proceduresMoney: ticket.proceduresMoney,
        productsMoney: ticket.productsMoney,
        radiologyMoney: ticket.radiologyMoney,
        discountMoney: ticket.discountMoney,
        discountPercent: ticket.discountPercent,
        discountType: ticket.discountType,
        surcharge: ticket.surcharge,
        totalMoney: ticket.totalMoney,
        // paid: ticket.paid, // nháp ko gửi paid và debt
        // debt: ticket.debt, // nháp ko gửi paid và debt
        expense: ticket.expense,
        profit: ticket.profit,
        note: ticket.note,
        registeredAt: ticket.registeredAt,
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i) => ({
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
      ticketOrderProcedureDraftList: (ticket.ticketProcedureList || []).map((i) => ({
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
    })
    const { data } = response.data as BaseResponse<{ ticketBasic: any }>
    return Ticket.from(data.ticketBasic)
  }

  static async updateDraftApproved(ticketId: number, ticket: Ticket) {
    const response = await AxiosInstance.patch(`/ticket-order/${ticketId}/update-draft-approved`, {
      ticketOrderDraftApprovedUpdate: {
        totalCostAmount: ticket.totalCostAmount,
        proceduresMoney: ticket.proceduresMoney,
        productsMoney: ticket.productsMoney,
        radiologyMoney: ticket.radiologyMoney,
        discountMoney: ticket.discountMoney,
        discountPercent: ticket.discountPercent,
        discountType: ticket.discountType,
        surcharge: ticket.surcharge,
        totalMoney: ticket.totalMoney,
        // paid: ticket.paid, // nháp ko gửi paid và debt
        // debt: ticket.debt, // nháp ko gửi paid và debt
        expense: ticket.expense,
        profit: ticket.profit,
        note: ticket.note,
        registeredAt: ticket.registeredAt,
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i) => ({
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
      ticketOrderProcedureDraftList: (ticket.ticketProcedureList || []).map((i) => ({
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
    })
    const { data } = response.data as BaseResponse<{ ticketBasic: any }>
    return Ticket.from(data.ticketBasic)
  }

  static async destroyDraft(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-order/${ticketId}/destroy-draft`)
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }

  static async createDebtSuccess(ticket: Ticket) {
    const response = await AxiosInstance.post('/ticket-order/create-debt-success', {
      ticketOrderDebtSuccessInsert: {
        customerId: ticket.customerId,
        totalCostAmount: ticket.totalCostAmount,
        proceduresMoney: ticket.proceduresMoney,
        productsMoney: ticket.productsMoney,
        radiologyMoney: ticket.radiologyMoney,
        discountMoney: ticket.discountMoney,
        discountPercent: ticket.discountPercent,
        discountType: ticket.discountType,
        surcharge: ticket.surcharge,
        totalMoney: ticket.totalMoney,
        paid: ticket.paid, // close gửi thêm giá trị paid
        // debt: ticket.debt, // backend tự tính
        expense: ticket.expense,
        profit: ticket.profit,
        note: ticket.note,
        registeredAt: ticket.registeredAt,
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i) => ({
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
      ticketOrderProcedureDraftList: (ticket.ticketProcedureList || []).map((i) => ({
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
    })
    const { data } = response.data as BaseResponse<{ ticketBasic: any }>
    return Ticket.from(data.ticketBasic)
  }

  static async updateDebtSuccess(ticketId: number, ticket: Ticket) {
    const response = await AxiosInstance.patch(`/ticket-order/${ticketId}/update-debt-success`, {
      ticketOrderDebtSuccessUpdate: {
        // customerId: ticket.customerId, // không cho thay đổi customerID
        totalCostAmount: ticket.totalCostAmount,
        proceduresMoney: ticket.proceduresMoney,
        productsMoney: ticket.productsMoney,
        radiologyMoney: ticket.radiologyMoney,
        discountMoney: ticket.discountMoney,
        discountPercent: ticket.discountPercent,
        discountType: ticket.discountType,
        surcharge: ticket.surcharge,
        totalMoney: ticket.totalMoney,
        paid: ticket.paid, // close gửi thêm giá trị paid
        // debt: ticket.debt, // backend tự tính
        expense: ticket.expense,
        profit: ticket.profit,
        note: ticket.note,
        registeredAt: ticket.registeredAt,
      },
      ticketOrderProductDraftList: (ticket.ticketProductList || []).map((i) => ({
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
      ticketOrderProcedureDraftList: (ticket.ticketProcedureList || []).map((i) => ({
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
    })
    const { data } = response.data as BaseResponse<{ ticketBasic: any }>
    return Ticket.from(data.ticketBasic)
  }
}
