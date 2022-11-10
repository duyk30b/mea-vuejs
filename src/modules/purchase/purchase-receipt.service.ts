import { AxiosInstance } from '@/core/axios.instance'
import type { PaymentStatus } from '../enum'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Receipt } from '../receipt'
import { Purchase } from './purchase.model'

export interface PurchasePaginationQuery extends ApiPaginationRequest {
	filter?: {
		distributor_id?: number,
		from_time?: number,
		to_time?: number,
		payment_status?: PaymentStatus
	}
	relations?: { distributor: boolean },
}

export class PurchaseReceiptService {
	static async pagination(params: PurchasePaginationQuery) {
		const response = await AxiosInstance.get('/purchase/pagination', { params })
		const data = response.data as ApiPaginationResponse

		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: Purchase.fromPlains(data.data),
		}
	}

	static async getOne(id: number, relations?: { distributor?: boolean, receipts?: boolean }): Promise<Purchase> {
		const { data } = await AxiosInstance.get(`/purchase/detail/${id}`, {
			params: {
				relations: {
					distributor: relations?.distributor,
					receipts: relations?.receipts,
				},
			},
		})
		return Purchase.fromPlain(data)
	}

	static async createReceiptDraft(receipt: Receipt) {
		const receiptDto = Receipt.toPlain(receipt, 'CREATE')
		const { data } = await AxiosInstance.post('/purchase/create-receipt-draft', receiptDto)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { receiptId: number, purchaseId: number },
		}
	}

	static async createReceiptDraftAfterRefund(purchaseId: number, receipt: Receipt) {
		const receiptDto = Receipt.toPlain(receipt, 'CREATE')
		const { data } = await AxiosInstance.post(`/purchase/create-receipt-draft-after-refund/${purchaseId}`, receiptDto)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { receiptId: number, purchaseId: number },
		}
	}

	static async updateReceiptDraft(receiptId: number, receipt: Receipt) {
		const receiptDto = Receipt.toPlain(receipt, 'UPDATE')
		const { data } = await AxiosInstance.put(`/purchase/receipt/update-draft/${receiptId}`, receiptDto)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { receiptId: number, purchaseId: number },
		}
	}

	static async paymentReceiptDraft(receiptId: number) {
		const { data } = await AxiosInstance.patch(`/purchase/receipt/payment-draft/${receiptId}`)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { receiptId: number, purchaseId: number },
		}
	}

	static async refundReceipt(receiptId: number) {
		const { data } = await AxiosInstance.patch(`/purchase/receipt/refund/${receiptId}`)
		return {
			success: data.success,
			message: data.message,
			data: data.data as { receiptId: number, purchaseId: number },
		}
	}
}
