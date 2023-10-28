import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Invoice, InvoiceStatus } from './invoice.model'

export interface InvoicePaginationQuery extends ApiPaginationRequest {
	filter?: {
		customer_id?: number,
		from_time?: number,
		to_time?: number,
		status?: InvoiceStatus,
	}
	relation?: {
		customer?: boolean,
		invoice_items?: boolean,
	}
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

	static async detail(id: number, relation?: { customer?: boolean, invoiceItems?: boolean }): Promise<Invoice> {
		const { data } = await AxiosInstance.get(`/invoice/detail/${id}`, {
			params: {
				relation: {
					customer: relation?.customer,
					invoice_items: relation?.invoiceItems,
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

	static async deleteDraft(invoiceId: number) {
		const { data } = await AxiosInstance.delete(`/invoice/delete-draft/${invoiceId}`)
		return data as { success: boolean }
	}

	static async startShip(invoiceId: number) {
		const { data } = await AxiosInstance.post(`/invoice/start-ship/${invoiceId}`)
		return data as { success: boolean }
	}

	static async startPayment(invoiceId: number, debt: number) {
		const { data } = await AxiosInstance.post(`/invoice/start-payment/${invoiceId}`, { debt })
		return data as { success: boolean }
	}

	static async startShipAndPayment(invoiceId: number, debt: number) {
		const { data } = await AxiosInstance.post(`/invoice/start-ship-and-payment/${invoiceId}`, { debt })
		return data as { success: boolean }
	}

	static async startRefund(invoiceId: number) {
		const { data } = await AxiosInstance.post(`/invoice/start-refund/${invoiceId}`)
		return data as { success: boolean }
	}
}
