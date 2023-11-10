import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Receipt, ReceiptStatus } from './receipt.model'

export type ReceiptFilterQuery = {
	distributor_id?: number,
	from_time?: number,
	to_time?: number,
	status?: ReceiptStatus,
	has_delete?: boolean,
}

export type ReceiptRelationQuery = {
	distributor?: boolean,
	distributor_payments?: boolean,
	receipt_items?: boolean,
}

export interface ReceiptPaginationQuery extends ApiPaginationRequest {
	filter?: ReceiptFilterQuery
	relation?: ReceiptRelationQuery
}

export type ReceiptListQuery = {
	limit?: number
	filter?: ReceiptFilterQuery
	relation?: ReceiptRelationQuery
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

	static async list(params: ReceiptListQuery) {
		const { data } = await AxiosInstance.get('/receipt/list', { params })
		return Receipt.fromPlains(data)
	}

	static async detail(id: number, relation?: ReceiptRelationQuery): Promise<Receipt> {
		const { data } = await AxiosInstance.get(`/receipt/detail/${id}`, {
			params: {
				relation: {
					distributor: relation?.distributor,
					receipt_items: relation?.receipt_items,
					distributor_payments: relation?.distributor_payments,
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

	static async destroyDraft(receiptId: number) {
		const { data } = await AxiosInstance.delete(`/receipt/destroy-draft/${receiptId}`)
		return data as { success: boolean }
	}

	static async prepayment(receiptId: number, money: number) {
		const { data } = await AxiosInstance.post(`/receipt/prepayment/${receiptId}`, { money })
		return data as { success: boolean }
	}

	static async startShipAndPayment(receiptId: number, money: number) {
		const { data } = await AxiosInstance.post(`/receipt/start-ship-and-payment/${receiptId}`, { money })
		return data as { success: boolean }
	}

	static async payDebt(receiptId: number, money: number) {
		const { data } = await AxiosInstance.post(`/receipt/pay-debt/${receiptId}`, { money })
		return data as { success: boolean }
	}

	static async startRefund(receiptId: number) {
		const { data } = await AxiosInstance.post(`/receipt/start-refund/${receiptId}`)
		return data as { success: boolean }
	}

	static async softDeleteRefund(receiptId: number) {
		const { data } = await AxiosInstance.delete(`/receipt/soft-delete-refund/${receiptId}`)
		return data as { success: boolean }
	}
}
