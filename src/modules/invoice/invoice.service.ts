import { AxiosInstance } from '@/core/axios.instance'
import { Invoice } from '.'
import type { PaymentStatus } from '../enum'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'

export interface InvoicePaginationQuery extends ApiPaginationRequest {
	filter?: {
		customer_id?: number,
		from_time?: number,
		to_time?: number,
		payment_status?: PaymentStatus
	}
	relations?: {
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

	static async getOne(id: number, relations?: { customer?: boolean, invoiceItems?: boolean }): Promise<Invoice> {
		const { data } = await AxiosInstance.get(`/invoice/detail/${id}`, {
			params: {
				relations: {
					customer: relations?.customer,
					invoice_items: relations?.invoiceItems,
				},
			},
		})
		return Invoice.fromPlain(data)
	}
}
