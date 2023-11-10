import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Invoice, InvoiceStatus } from './invoice.model'

export type InvoiceFilterQuery = {
	customer_id?: number,
	from_time?: number,
	to_time?: number,
	status?: InvoiceStatus,
	has_delete?: boolean,
}

export type InvoiceRelationQuery = {
	customer?: boolean,
	customer_payments?: boolean
	invoice_items?: boolean,
}

export interface InvoicePaginationQuery extends ApiPaginationRequest {
	filter?: InvoiceFilterQuery
	relation?: InvoiceRelationQuery
}

export type InvoiceListQuery = {
	limit?: number
	filter?: InvoiceFilterQuery,
	relation?: InvoiceRelationQuery
}

export class InvoiceService {
	static async pagination(params: InvoicePaginationQuery) {
		const response = await AxiosInstance.get('/invoice/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: Invoice.fromPlains(data.data),
		}
	}

	static async list(params: InvoiceListQuery) {
		const { data } = await AxiosInstance.get('/invoice/list', { params })
		return Invoice.fromPlains(data)
	}

	static async detail(id: number, relation?: InvoiceRelationQuery): Promise<Invoice> {
		const { data } = await AxiosInstance.get(`/invoice/detail/${id}`, {
			params: {
				relation: {
					customer: relation?.customer,
					invoice_items: relation?.invoice_items,
					customer_payments: relation?.customer_payments,
				},
			},
		})
		return Invoice.fromPlain(data)
	}

	static async createDraft(invoice: Invoice) {
		const invoiceDto = Invoice.toPlain(invoice, 'CREATE')
		const { data } = await AxiosInstance.post('/invoice/create-draft', invoiceDto)
		return data as { invoiceId: number }
	}

	static async updateDraft(invoiceId: number, invoice: Invoice) {
		const invoiceDto = Invoice.toPlain(invoice, 'UPDATE')
		const { data } = await AxiosInstance.patch(`/invoice/update-draft/${invoiceId}`, invoiceDto)
		return data as { invoiceId: number }
	}

	static async destroyDraft(invoiceId: number) {
		const { data } = await AxiosInstance.delete(`/invoice/destroy-draft/${invoiceId}`)
		return data as { success: boolean }
	}

	static async prepayment(invoiceId: number, money: number) {
		const { data } = await AxiosInstance.post(`/invoice/prepayment/${invoiceId}`, { money })
		return data as { success: boolean }
	}

	static async startShipAndPayment(invoiceId: number, money: number) {
		const { data } = await AxiosInstance.post(`/invoice/start-ship-and-payment/${invoiceId}`, { money })
		return data as { success: boolean }
	}

	static async payDebt(invoiceId: number, money: number) {
		const { data } = await AxiosInstance.post(`/invoice/pay-debt/${invoiceId}`, { money })
		return data as { success: boolean }
	}

	static async startRefund(invoiceId: number) {
		const { data } = await AxiosInstance.post(`/invoice/start-refund/${invoiceId}`)
		return data as { success: boolean }
	}

	static async softDeleteRefund(invoiceId: number) {
		const { data } = await AxiosInstance.delete(`/invoice/soft-delete-refund/${invoiceId}`)
		return data as { success: boolean }
	}
}
