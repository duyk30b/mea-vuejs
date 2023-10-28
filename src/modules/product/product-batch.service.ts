import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest } from '../pagination'
import { ProductBatch } from './product-batch.model'

export type ProductBatchFilterQuery = {
	product_id?: number,
	quantity_zero?: 'true' | 'false',
	overdue?: boolean,
	is_active?: 'true' | 'false',
	group?: string
	search_text?: string,
}

export type ProductBatchRelationQuery = {
	product?: boolean
}

export interface ProductBatchPaginationQuery extends ApiPaginationRequest {
	relation?: ProductBatchRelationQuery,
	filter?: ProductBatchFilterQuery,
	sort?: {
		id?: 'ASC' | 'DESC',
		expiry_date?: 'ASC' | 'DESC',
	}
}

export type ProductBatchListQuery = {
	relation?: ProductBatchRelationQuery
	filter?: ProductBatchFilterQuery,
	limit?: number
}

export class ProductBatchService {
	static async pagination(params: ProductBatchPaginationQuery) {
		const response = await AxiosInstance.get('/product-batch/pagination', { params })
		return {
			total: response.data.total,
			page: response.data.page,
			limit: response.data.limit,
			data: ProductBatch.fromPlains(response.data.data),
		}
	}

	static async list(params: ProductBatchListQuery): Promise<ProductBatch[]> {
		const { data } = await AxiosInstance.get('/product-batch/list', { params })
		return ProductBatch.fromPlains(data)
	}

	static async getOne(id: number, relation?: { product: boolean }) {
		const { data } = await AxiosInstance.get(
			`/product-batch/detail/${id}`,
			{ params: { relation: { product: relation?.product } } }
		)
		return ProductBatch.fromPlain(data)
	}

	static async createOne(productBatch: ProductBatch) {
		const productBatchDto = ProductBatch.toPlain(productBatch, 'CREATE')
		const { data } = await AxiosInstance.post('/product-batch/create', productBatchDto)

		return ProductBatch.fromPlain(data)
	}

	static async updateOne(id: number, productBatch: ProductBatch) {
		const productBatchDto = ProductBatch.toPlain(productBatch, 'UPDATE')
		const { data } = await AxiosInstance.patch(`/product-batch/update/${id}`, productBatchDto)

		return ProductBatch.fromPlain(data)
	}

	static async deleteOne(id: number) {
		const response = await AxiosInstance.delete(`/product-batch/delete/${id}`)
		return response.data as { success: 'true' | 'false', message?: string }
	}
}
