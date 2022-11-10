import { AxiosInstance } from '@/core/axios.instance'
import { convertViToEn } from '@/utils'
import { debounceAsync } from '@/utils/helpers'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Distributor } from './distributor.model'

export interface DistributorFilterQuery {
	is_active?: 'true' | 'false',
	phone?: string,
	full_name_en?: string
}
export interface DistributorPaginationQuery extends ApiPaginationRequest {
	filter?: DistributorFilterQuery,
	sort?: {
		id?: 'ASC' | 'DESC',
		debt?: 'ASC' | 'DESC',
		full_name_en?: 'ASC' | 'DESC'
	}
}

export class DistributorService {
	static async pagination(params: DistributorPaginationQuery) {
		const response = await AxiosInstance.get('/distributor/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: Distributor.fromPlains(data.data),
		}
	}

	static search = debounceAsync(async (text: string): Promise<Distributor[]> => {
		const filter: DistributorFilterQuery = { is_active: 'true' }
		if (text) {
			if (/^\d+$/.test(text)) filter.phone = text
			else {
				filter.full_name_en = convertViToEn(text)
			}
		}
		const response = await AxiosInstance.get('/distributor/list', {
			params: {
				filter,
				limit: 10,
			},
		})
		return Distributor.fromPlains(response.data)
	}, 200)

	static async getOne(id: number): Promise<Distributor> {
		const { data } = await AxiosInstance.get(`/distributor/detail/${id}`)
		return Distributor.fromPlain(data)
	}

	static async createOne(distributor: Distributor) {
		if (distributor.fullNameVi) {
			distributor.fullNameEn = convertViToEn(distributor.fullNameVi)
		}
		const distributorDto = Distributor.toPlain(distributor)
		const { data } = await AxiosInstance.post('/distributor/create', distributorDto)

		return Distributor.fromPlain(data)
	}

	static async updateOne(id: number, distributor: Distributor) {
		if (distributor.fullNameVi) {
			distributor.fullNameEn = convertViToEn(distributor.fullNameVi)
		}
		const distributorDto = Distributor.toPlain(distributor)
		const { data } = await AxiosInstance.patch(`/distributor/update/${id}`, distributorDto)

		return Distributor.fromPlain(data)
	}
}
