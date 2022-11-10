import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { ProductMovement } from './product-movement.model'

export interface ProductMovementPaginationQuery extends ApiPaginationRequest {
	filter?: {
		product_id?: number,
		product_batch_id?: number
	}
	relations?: {
		product_batch?: boolean,
		invoice?: boolean,
		receipt?: boolean
	}
}
export class ProductMovementService {
	static async pagination(params: ProductMovementPaginationQuery) {
		const response = await AxiosInstance.get('/product-movement/pagination', { params })
		const data = response.data as ApiPaginationResponse

		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: ProductMovement.fromPlains(data.data),
		}
	}
}
