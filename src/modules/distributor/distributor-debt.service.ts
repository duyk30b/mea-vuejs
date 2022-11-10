import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { DistributorDebt } from './distributor-debt.model'
import { Distributor } from './distributor.model'

export interface DistributorDebtPaginationQuery extends ApiPaginationRequest {
	filter: { distributor_id: number },
}
export class DistributorDebtService {
	static async pagination(params: DistributorDebtPaginationQuery) {
		const response = await AxiosInstance.get('/distributor-debt/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: DistributorDebt.fromPlains(data.data),
		}
	}

	static async payment(distributorDebt: DistributorDebt) {
		const distributorDebtDto = DistributorDebt.toPlain(distributorDebt)
		const { data } = await AxiosInstance.post('/distributor-debt/payment', distributorDebtDto)

		return {
			distributor: Distributor.fromPlain(data.distributor),
			distributorDebt: DistributorDebt.fromPlain(data.distributorDebt),
		}
	}
}
