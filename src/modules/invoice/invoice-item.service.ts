import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { InvoiceItem, InvoiceItemType } from './invoice-item.model'

export interface InvoiceItemPaginationQuery extends ApiPaginationRequest {
	filter?: {
		reference_id?: number,
		customer_id?: number,
		type?: InvoiceItemType,
	}
	relation?: {
		invoice?: { customer?: boolean },
		product_batch?: { product?: boolean }
		procedure?: boolean,
	}
}

export class InvoiceItemService {
	static async pagination(params: InvoiceItemPaginationQuery) {
		const response = await AxiosInstance.get('/invoice-item/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: InvoiceItem.fromPlains(data.data),
		}
	}
}