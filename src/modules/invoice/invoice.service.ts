import { AxiosInstance } from '../../core/axios.instance'
import type { ApiPaginationResponse } from '../pagination'
import { Product } from '../product'
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
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Invoice.fromPlains(data.data),
    }
  }

  static async list(options: InvoiceListQuery) {
    const params = InvoiceGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get('/invoice/list', { params })
    return Invoice.fromPlains(data)
  }

  static async detail(id: number, options: InvoiceDetailQuery): Promise<Invoice> {
    const params = InvoiceGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get(`/invoice/detail/${id}`, { params })
    return Invoice.fromPlain(data)
  }

  static async createBasic(instance: Invoice) {
    const plain = Invoice.toPlain(instance, 'CREATE')
    const { data } = await AxiosInstance.post('/invoice/create-basic', plain)
    return data as { invoiceId: number }
  }

  static async updateBasic(oldInvoiceId: number, instance: Invoice) {
    const plain = Invoice.toPlain(instance, 'CREATE') // tạo đơn mới đè lên đơn cũ
    const { data } = await AxiosInstance.patch(`/invoice/update-basic/${oldInvoiceId}`, plain)
    return data as { invoiceId: number }
  }

  static async createDraft(instance: Invoice) {
    const plain = Invoice.toPlain(instance, 'CREATE')
    const { data } = await AxiosInstance.post('/invoice/create-draft', plain)
    return data as { invoiceId: number }
  }

  static async updateDraft(invoiceId: number, instance: Invoice) {
    const plain = Invoice.toPlain(instance, 'UPDATE')
    const { data } = await AxiosInstance.patch(`/invoice/update-draft/${invoiceId}`, plain)
    return data as { invoiceId: number }
  }

  static async destroyDraft(invoiceId: number) {
    const { data } = await AxiosInstance.delete(`/invoice/destroy-draft/${invoiceId}`)
    return data as { invoiceId: number }
  }

  static async prepayment(invoiceId: number, money: number) {
    const { data } = await AxiosInstance.post(`/invoice/prepayment/${invoiceId}`, { money })
    return data as { invoiceId: number }
  }

  static async startShipAndPayment(invoiceId: number, money: number) {
    const { data } = await AxiosInstance.post(`/invoice/start-ship-and-payment/${invoiceId}`, {
      money,
    })
    return data as { invoiceId: number }
  }

  static async payDebt(invoiceId: number, money: number) {
    const { data } = await AxiosInstance.post(`/invoice/pay-debt/${invoiceId}`, { money })
    return data as { invoiceId: number }
  }

  static async startRefund(invoiceId: number) {
    const { data } = await AxiosInstance.post(`/invoice/start-refund/${invoiceId}`)
    return data as { invoiceId: number }
  }

  static async softDeleteRefund(invoiceId: number) {
    const { data } = await AxiosInstance.delete(`/invoice/soft-delete-refund/${invoiceId}`)
    return data as { invoiceId: number }
  }

  static async sumDebt(options: InvoiceSumDebtQuery) {
    const params = InvoiceGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get('/invoice/sum-debt', { params })
    return data as { invoiceSumDebt: number }
  }
}
