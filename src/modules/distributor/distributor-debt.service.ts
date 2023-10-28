import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { DistributorDebt } from './distributor-debt.model'
import { Distributor } from './distributor.model'
import { DistributorService } from './distributor.service'

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

	static async payment(data: DistributorDebt) {
		const distributorDebtDto = DistributorDebt.toPlain(data)
		const response = await AxiosInstance.post('/distributor-debt/payment', distributorDebtDto)

		const distributor = Distributor.fromPlain(response.data.distributor)
		const distributorDebt = DistributorDebt.fromPlain(response.data.distributorDebt)

		return { distributor, distributorDebt }
	}
}
