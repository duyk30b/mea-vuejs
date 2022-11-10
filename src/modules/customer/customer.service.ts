import { AxiosInstance } from '@/core/axios.instance'
import { convertViToEn } from '@/utils'
import { debounceAsync } from '@/utils/helpers/function.helper'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Customer } from './customer.model'

export interface CustomerFilterQuery {
	is_active?: 'true' | 'false',
	phone?: string,
	full_name_en?: string
}
export interface CustomerPaginationQuery extends ApiPaginationRequest {
	filter?: CustomerFilterQuery,
	sort?: {
		id?: 'ASC' | 'DESC',
		debt?: 'ASC' | 'DESC',
		full_name_en?: 'ASC' | 'DESC'
	}
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

	static searchByFullNameOrPhone = debounceAsync(async (text: string): Promise<Customer[]> => {
		const filter: CustomerFilterQuery = { is_active: 'true' }
		if (text) {
			if (/^\d+$/.test(text)) filter.phone = text
			else {
				filter.full_name_en = convertViToEn(text)
			}
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
		if (customer.fullNameVi) {
			customer.fullNameEn = convertViToEn(customer.fullNameVi)
		}
		const customerDto = Customer.toPlain(customer)
		const { data } = await AxiosInstance.post('/customer/create', customerDto)

		return Customer.fromPlain(data)
	}

	static async updateOne(id: number, customer: Partial<Customer>) {
		if (customer.fullNameVi) {
			customer.fullNameEn = convertViToEn(customer.fullNameVi)
		}
		const customerDto = Customer.toPlain(customer)
		const response = await AxiosInstance.patch(`/customer/update/${id}`, customerDto)

		return Customer.fromPlain(response.data)
	}
}
