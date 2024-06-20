import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { CustomerPayment } from '../customer-payment/customer-payment.model'
import { InvoiceItem } from '../invoice-item/invoice-item.model'
import { InvoiceExpense } from './invoice-expense.model'
import { InvoiceSurcharge } from './invoice-surcharge.model'
import {
  InvoiceDetailQuery,
  InvoiceGetQuery,
  InvoiceListQuery,
  InvoicePaginationQuery,
  InvoiceSumDebtQuery,
} from './invoice.dto'
import { Invoice } from './invoice.model'

export class InvoiceApi {
  static async pagination(options: InvoicePaginationQuery) {
    const params = InvoiceGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/invoice/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Invoice.fromPlains(data),
    }
  }

  static async list(options: InvoiceListQuery) {
    const params = InvoiceGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/invoice/list', { params })
    const { data } = response.data as BaseResponse
    return Invoice.fromPlains(data)
  }

  static async detail(id: number, options: InvoiceDetailQuery): Promise<Invoice> {
    const params = InvoiceGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/invoice/detail/${id}`, { params })
    const { data } = response.data as BaseResponse
    return Invoice.fromPlain(data || {})
  }

  static async createDraft(instance: Invoice) {
    const body = {
      invoice: Invoice.toPlain(instance, 'USER_CREATE'),
      invoiceItemList: InvoiceItem.toPlains(instance.invoiceItems || [], 'USER_CREATE'),
      invoiceSurchargeList: InvoiceSurcharge.toPlains(
        instance.invoiceSurcharges || [],
        'USER_CREATE'
      ),
      invoiceExpenseList: InvoiceExpense.toPlains(instance.invoiceExpenses || [], 'USER_CREATE'),
    }
    const response = await AxiosInstance.post('/invoice/create-draft', body)
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async destroyDraft(invoiceId: number) {
    const response = await AxiosInstance.delete(`/invoice/destroy-draft/${invoiceId}`)
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async prepayment(invoiceId: number, money: number) {
    const response = await AxiosInstance.post(`/invoice/prepayment/${invoiceId}`, { money })
    const { data } = response.data as BaseResponse<{ invoiceBasic: any; customerPayments: any[] }>
    return {
      invoiceBasic: Invoice.toBasic(data.invoiceBasic || {}),
      customerPayments: CustomerPayment.toBasics(data.customerPayments || []),
    }
  }

  static async refundPrepayment(invoiceId: number, money: number) {
    const response = await AxiosInstance.post(`/invoice/refund-prepayment/${invoiceId}`, { money })
    const { data } = response.data as BaseResponse<{ invoiceBasic: any; customerPayments: any[] }>
    return {
      invoiceBasic: Invoice.toBasic(data.invoiceBasic || {}),
      customerPayments: CustomerPayment.toBasics(data.customerPayments || []),
    }
  }

  static async sendProductAndPayment(invoiceId: number, money: number) {
    const response = await AxiosInstance.post(`/invoice/send-product-and-payment/${invoiceId}`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ invoiceBasic: any; customerPayments: any[] }>
    return {
      invoiceBasic: Invoice.toBasic(data.invoiceBasic || {}),
      customerPayments: CustomerPayment.toBasics(data.customerPayments || []),
    }
  }

  static async payDebt(invoiceId: number, money: number) {
    const response = await AxiosInstance.post(`/invoice/pay-debt/${invoiceId}`, { money })
    const { data } = response.data as BaseResponse<{ invoiceBasic: any; customerPayments: any[] }>
    return {
      invoiceBasic: Invoice.toBasic(data.invoiceBasic || {}),
      customerPayments: CustomerPayment.toBasics(data.customerPayments || []),
    }
  }

  static async returnProduct(invoiceId: number, money: number) {
    const response = await AxiosInstance.post(`/invoice/return-product/${invoiceId}`, { money })
    const { data } = response.data as BaseResponse<{ invoiceBasic: any; customerPayments: any[] }>
    return {
      invoiceBasic: Invoice.toBasic(data.invoiceBasic || {}),
      customerPayments: CustomerPayment.toBasics(data.customerPayments || []),
    }
  }

  static async softDeleteRefund(invoiceId: number) {
    const response = await AxiosInstance.delete(`/invoice/soft-delete-refund/${invoiceId}`)
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async sumInvoiceDebt(options: InvoiceSumDebtQuery) {
    const params = InvoiceGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/invoice/sum-invoice-debt', { params })
    const { data } = response.data as BaseResponse<{ sumInvoiceDebt: number }>
    return data
  }

  static async createQuickInvoice(instance: Invoice) {
    const body = {
      invoice: Invoice.toPlain(instance, 'USER_CREATE'),
      invoiceItemList: InvoiceItem.toPlains(instance.invoiceItems || [], 'USER_CREATE'),
      invoiceSurchargeList: InvoiceSurcharge.toPlains(
        instance.invoiceSurcharges || [],
        'USER_CREATE'
      ),
      invoiceExpenseList: InvoiceExpense.toPlains(instance.invoiceExpenses || [], 'USER_CREATE'),
    }
    const response = await AxiosInstance.post('/invoice/create-quick-invoice', body)
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async updateInvoiceDraftAndInvoicePrepayment(invoiceId: number, instance: Invoice) {
    const body = {
      invoice: Invoice.toPlain(instance, 'USER_UPDATE'),
      invoiceItemList: InvoiceItem.toPlains(instance.invoiceItems || [], 'USER_UPDATE'),
      invoiceSurchargeList: InvoiceSurcharge.toPlains(
        instance.invoiceSurcharges || [],
        'USER_UPDATE'
      ),
      invoiceExpenseList: InvoiceExpense.toPlains(instance.invoiceExpenses || [], 'USER_UPDATE'),
    }
    const response = await AxiosInstance.patch(
      `/invoice/update-invoice-draft-and-invoice-prepayment/${invoiceId}`,
      body
    )
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async updateInvoiceDebtAndInvoiceSuccess(invoiceId: number, instance: Invoice) {
    const body = {
      invoice: Invoice.toPlain(instance, 'USER_CREATE'),
      invoiceItemList: InvoiceItem.toPlains(instance.invoiceItems || [], 'USER_CREATE'),
      invoiceSurchargeList: InvoiceSurcharge.toPlains(
        instance.invoiceSurcharges || [],
        'USER_CREATE'
      ),
      invoiceExpenseList: InvoiceExpense.toPlains(instance.invoiceExpenses || [], 'USER_CREATE'),
    }
    const response = await AxiosInstance.patch(
      `/invoice/update-invoice-debt-and-invoice-success/${invoiceId}`,
      body
    )
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }
}
