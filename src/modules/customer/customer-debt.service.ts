import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { CustomerDebt } from './customer-debt.model'
import { Customer } from './customer.model'

export interface CustomerDebtPaginationQuery extends ApiPaginationRequest {
	filter: { customer_id: number }
}
export class CustomerDebtService {
	static async pagination(params: CustomerDebtPaginationQuery) {
		const response = await AxiosInstance.get('/customer-debt/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: CustomerDebt.fromPlains(data.data),
		}
	}

	static async payment(customerDebt: CustomerDebt) {
		const customerDebtDto = CustomerDebt.toPlain(customerDebt)
		const { data } = await AxiosInstance.post('/customer-debt/payment', customerDebtDto)

		return {
			customer: Customer.fromPlain(data.customer),
			customerDebt: CustomerDebt.fromPlain(data.customerDebt),
		}
	}
}
