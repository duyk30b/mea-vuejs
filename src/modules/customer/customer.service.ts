import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Customer } from './customer.model'
import { debounceAsync } from '@/utils/helpers'

export interface CustomerFilterQuery {
	is_active?: 'true' | 'false',
	search_text?: string,
}
export interface CustomerPaginationQuery extends ApiPaginationRequest {
	filter?: CustomerFilterQuery,
	sort?: {
		id?: 'ASC' | 'DESC',
		debt?: 'ASC' | 'DESC',
		full_name?: 'ASC' | 'DESC'
	}
}

export type CustomerListQuery = {
	limit?: number
	filter?: CustomerFilterQuery,
}

export class CustomerService {
	static async pagination(params: CustomerPaginationQuery) {
		const response = await AxiosInstance.get('/customer/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: Customer.fromPlains(data.data),
		}
	}

	static async list(params: CustomerListQuery): Promise<Customer[]> {
		const { data } = await AxiosInstance.get('/customer/list', { params })
		return Customer.fromPlains(data)
	}

	static search = debounceAsync(async (text: string): Promise<Customer[]> => {
		const filter: CustomerFilterQuery = {
			is_active: 'true',
			search_text: text,
		}
		const response = await AxiosInstance.get('/customer/list', {
			params: {
				filter,
				limit: 10,
			},
		})
		return Customer.fromPlains(response.data)
	}, 200)

	static async getOne(id: number): Promise<Customer> {
		const { data } = await AxiosInstance.get(`/customer/detail/${id}`)
		return Customer.fromPlain(data)
	}

	static async createOne(customer: Customer) {
		const customerDto = Customer.toPlain(customer)
		const { data } = await AxiosInstance.post('/customer/create', customerDto)

		return Customer.fromPlain(data)
	}

	static async updateOne(id: number, customer: Partial<Customer>) {
		const customerDto = Customer.toPlain(customer)
		const response = await AxiosInstance.patch(`/customer/update/${id}`, customerDto)

		return Customer.fromPlain(response.data)
	}
}
