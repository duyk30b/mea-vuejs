import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  InvoiceDetailQuery,
  InvoiceGetQuery,
  InvoiceListQuery,
  InvoicePaginationQuery,
  InvoiceSumDebtQuery,
} from './invoice.dto'
import { Invoice } from './invoice.model'

export class InvoiceService {
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
    return Invoice.fromPlain(data)
  }

  static async createBasic(instance: Invoice) {
    const plain = Invoice.toPlain(instance, 'USER_CREATE')
    const response = await AxiosInstance.post('/invoice/create-basic', plain)
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async updateBasic(oldInvoiceId: number, instance: Invoice) {
    const plain = Invoice.toPlain(instance, 'USER_CREATE') // tạo đơn mới đè lên đơn cũ
    const response = await AxiosInstance.patch(`/invoice/update-basic/${oldInvoiceId}`, plain)
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async createDraft(instance: Invoice) {
    const plain = Invoice.toPlain(instance, 'USER_CREATE')
    const response = await AxiosInstance.post('/invoice/create-draft', plain)
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async updateDraft(invoiceId: number, instance: Invoice) {
    const plain = Invoice.toPlain(instance, 'USER_UPDATE')
    const response = await AxiosInstance.patch(`/invoice/update-draft/${invoiceId}`, plain)
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
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async startShipAndPayment(invoiceId: number, money: number) {
    const response = await AxiosInstance.post(`/invoice/start-ship-and-payment/${invoiceId}`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async payDebt(invoiceId: number, money: number) {
    const response = await AxiosInstance.post(`/invoice/pay-debt/${invoiceId}`, { money })
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
  }

  static async startRefund(invoiceId: number) {
    const response = await AxiosInstance.post(`/invoice/start-refund/${invoiceId}`)
    const { data } = response.data as BaseResponse<{ invoiceId: number }>
    return data
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
}
