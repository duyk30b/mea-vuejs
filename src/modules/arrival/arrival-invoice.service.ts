import { AxiosInstance } from '@/core/axios.instance'
import type { PaymentStatus } from '../enum'
import { Invoice } from '../invoice'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Arrival } from './arrival.model'

export interface ArrivalPaginationQuery extends ApiPaginationRequest {
	filter?: {
		customer_id?: number,
		from_time?: number,
		to_time?: number,
		types?: string,
		payment_status?: PaymentStatus
	}
	relations?: {
		customer?: boolean,
		invoices?: boolean,
	}
}

export class ArrivalInvoiceService {
	static async pagination(params: ArrivalPaginationQuery) {
		const response = await AxiosInstance.get('/arrival/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: Arrival.fromPlains(data.data),
		}
	}

	static async detail(id: number, relations?: { customer?: boolean, invoices?: boolean }) {
		const { data } = await AxiosInstance.get(`/arrival/detail/${id}`, {
			params: {
				relations: {
					customer: relations?.customer,
					invoices: relations?.invoices,
				},
			},
		})
		return Arrival.fromPlain(data)
	}

	static async getOneByInvoiceId(invoiceId: number, relations?: { customer?: boolean, invoices?: boolean }) {
		const { data } = await AxiosInstance.get('/arrival/get-one-by-invoice-id', {
			params: {
				invoice_id: invoiceId,
				relations: {
					customer: relations?.customer,
					invoices: relations?.invoices,
				},
			},
		})
		return Arrival.fromPlain(data)
	}

	static async createInvoiceDraft(invoice: Invoice) {
		const invoiceDto = Invoice.toPlain(invoice)
		const { data } = await AxiosInstance.post(`/arrival/create-invoice-draft?customer_id=${invoice.customerId}`, invoiceDto)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { invoiceId: number, arrivalId: number },
		}
	}

	static async createInvoiceDraftAfterRefund(arrivalId: number, invoice: Invoice) {
		const invoiceDto = Invoice.toPlain(invoice)
		const { data } = await AxiosInstance.post(`/arrival/create-invoice-draft-after-refund/${arrivalId}`, invoiceDto)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { invoiceId: number, arrivalId: number },
		}
	}

	static async updateInvoiceDraft(invoiceId: number, invoice: Invoice) {
		const invoiceDto = Invoice.toPlain(invoice)
		const { data } = await AxiosInstance.put(`/arrival/invoice/update-draft/${invoiceId}`, invoiceDto)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { invoiceId: number, arrivalId: number },
		}
	}

	static async paymentInvoiceDraft(invoiceId: number) {
		const { data } = await AxiosInstance.patch(`/arrival/invoice/payment-draft/${invoiceId}`)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { invoiceId: number, arrivalId: number },
		}
	}

	static async refundInvoice(invoiceId: number) {
		const { data } = await AxiosInstance.patch(`/arrival/invoice/refund/${invoiceId}`)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { invoiceId: number, arrivalId: number },
		}
	}

	// static async onEventNewArrival(dto: Record<string, any>) {
	// 	await ArrivalInvoiceService.getAllArrivalToday()
	// }

	// static async getAllArrivalToday() {
	// 	const { data } = await AxiosInstance.get('/arrival/list', {
	// 		params: {
	// 			from_time: new Date(new Date().toDateString()).getTime(),
	// 			to_time: new Date(new Date().toDateString()).getTime() + 24 * 60 * 60 * 1000,
	// 		},
	// 	})

	// 	const arrivalStore = useArrivalStore()
	// 	const arrivals = Arrival.fromPlains(data.data)
	// 	arrivals.forEach((arrival) => {
	// 		arrivalStore.data[arrival.id as number] = arrival
	// 	})
	// }
}
