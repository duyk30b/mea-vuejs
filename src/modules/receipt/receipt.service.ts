import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Receipt, ReceiptStatus } from './receipt.model'

export interface ReceiptPaginationQuery extends ApiPaginationRequest {
	filter?: {
		distributor_id?: number,
		from_time?: number,
		to_time?: number,
		status?: ReceiptStatus
	}
	relation?: {
		distributor?: boolean,
		receipt_items?: boolean,
	}
}

export class ReceiptService {
	static async pagination(params: ReceiptPaginationQuery) {
		const response = await AxiosInstance.get('/receipt/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: Receipt.fromPlains(data.data),
		}
	}

	static async detail(id: number, relation?: { distributor?: boolean, receiptItems?: boolean }): Promise<Receipt> {
		const { data } = await AxiosInstance.get(`/receipt/detail/${id}`, {
			params: {
				relation: {
					distributor: relation?.distributor,
					receipt_items: relation?.receiptItems,
				},
			},
		})
		return Receipt.fromPlain(data)
	}

	static async createDraft(receipt: Receipt) {
		const receiptDto = Receipt.toPlain(receipt, 'CREATE')
		const { data } = await AxiosInstance.post('/receipt/create-draft', receiptDto)
		return data as { receiptId: number }
	}

	static async updateDraft(receiptId: number, receipt: Receipt) {
		const receiptDto = Receipt.toPlain(receipt, 'UPDATE')
		const { data } = await AxiosInstance.patch(`/receipt/update-draft/${receiptId}`, receiptDto)
		return data as { receiptId: number }
	}

	static async deleteDraft(receiptId: number) {
		const { data } = await AxiosInstance.delete(`/receipt/delete-draft/${receiptId}`)
		return data as { success: boolean }
	}

	static async startShipAndPayment(receiptId: number) {
		const { data } = await AxiosInstance.post(`/receipt/start-ship-and-payment/${receiptId}`)
		return data as { success: boolean }
	}

	static async startRefund(receiptId: number) {
		const { data } = await AxiosInstance.post(`/receipt/start-refund/${receiptId}`)
		return data as { success: boolean }
	}
}
