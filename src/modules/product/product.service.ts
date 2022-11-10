import { AxiosInstance } from '@/core/axios.instance'
import { debounceAsync } from '@/utils/helpers/function.helper'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Product } from './product.model'

export type ProductFilterQuery = {
	is_active?: 'true' | 'false',
	group?: string,
	search_text?: string,
	quantity_zero?: 'true' | 'false',
	overdue?: 'true' | 'false'
}

export type ProductRelationsQuery = {
	product_batches?: boolean
}

export type ProductListQuery = {
	limit: number
	filter?: ProductFilterQuery,
	relations?: ProductRelationsQuery
}

export interface ApiProductPaginationQuery extends ApiPaginationRequest {
	filter?: ProductFilterQuery,
	relations?: ProductRelationsQuery
	sort?: {
		id?: 'ASC' | 'DESC',
		brand_name?: 'ASC' | 'DESC'
	}
}

export class ProductService {
	static async pagination(params: ApiProductPaginationQuery) {
		const response = await AxiosInstance.get('/product/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: Product.fromPlains(data.data),
		}
	}

	static async list(params: ProductListQuery): Promise<Product[]> {
		const { data } = await AxiosInstance.get('/product/list', { params })
		return Product.fromPlains(data)
	}

	static search: (params: ProductListQuery) => Promise<Product[]>
		= debounceAsync(async (params: ProductListQuery): Promise<Product[]> => {
			const { data } = await AxiosInstance.get('/product/list', { params })
			return Product.fromPlains(data)
		}, 200)

	static async getOne(id: number, relations?: { productBatches: boolean }): Promise<Product> {
		const { data } = await AxiosInstance.get(
			`/product/detail/${id}`,
			{ params: { relations: { product_batches: relations?.productBatches } } }
		)
		return Product.fromPlain(data)
	}

	static async getManyByIds(ids: number[], relations?: { productBatches: boolean }): Promise<Product[]> {
		const { data } = await AxiosInstance.get('/product/list', {
			params: {
				ids,
				relations: { product_batches: relations?.productBatches },
			},
		})
		return Product.fromPlains(data)
	}

	static async createOne(product: Product) {
		const productDto = Product.toPlain(product)
		const { data } = await AxiosInstance.post('/product/create', productDto)

		return Product.fromPlain(data)
	}

	static async updateOne(id: number, product: Product) {
		const productDto = Product.toPlain(product)
		const { data } = await AxiosInstance.patch(`/product/update/${id}`, productDto)

		return Product.fromPlain(data)
	}

	static async removeOne(id: number) {
		const { data } = await AxiosInstance.patch(`/product/remove/${id}`)
		return data as { success: boolean }
	}
}
