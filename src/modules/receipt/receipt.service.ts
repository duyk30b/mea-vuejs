import { AxiosInstance } from '@/core/axios.instance'
import { Receipt } from '.'
import type { PaymentStatus } from '../enum'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'

export interface ReceiptPaginationQuery extends ApiPaginationRequest {
	filter?: {
		distributor_id?: number,
		from_time?: number,
		to_time?: number,
		payment_status?: PaymentStatus
	}
	relations?: {
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

	static async getOne(id: number, relations?: { distributor?: boolean, receiptItems?: boolean }): Promise<Receipt> {
		const { data } = await AxiosInstance.get(`/receipt/detail/${id}`, {
			params: {
				relations: {
					distributor: relations?.distributor,
					receipt_items: relations?.receiptItems,
				},
			},
		})
		return Receipt.fromPlain(data)
	}
}
