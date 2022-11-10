import { AxiosInstance } from '@/core/axios.instance'
import { convertViToEn, debounceAsync } from '@/utils/helpers'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Procedure } from './procedure.model'

export interface ProcedureFilterQuery {
	is_active?: 'true' | 'false',
	group?: string,
	search_text?: string,
}
export interface ProcedurePaginationQuery extends ApiPaginationRequest {
	filter?: ProcedureFilterQuery,
}

export type ProcedureListQuery = {
	limit: number
	filter?: ProcedureFilterQuery,
}

export class ProcedureService {
	static async pagination(params: ProcedurePaginationQuery) {
		const response = await AxiosInstance.get('/procedure/pagination', { params })
		const data = response.data as ApiPaginationResponse
		return {
			total: data.total,
			page: data.page,
			limit: data.limit,
			data: Procedure.fromPlains(data.data),
		}
	}

	static list: (params: ProcedureListQuery) => Promise<Procedure[]>
		= debounceAsync(async (params: ProcedureListQuery): Promise<Procedure[]> => {
			const { data } = await AxiosInstance.get('/procedure/list', { params })
			return Procedure.fromPlains(data)
		}, 200)

	static async getOne(id: number): Promise<Procedure> {
		const { data } = await AxiosInstance.get(`/procedure/detail/${id}`)
		return Procedure.fromPlain(data)
	}

	static async createOne(procedure: Procedure) {
		if (procedure.nameVi) {
			procedure.nameEn = convertViToEn(procedure.nameVi)
		}
		const procedureDto = Procedure.toPlain(procedure)
		const { data } = await AxiosInstance.post('/procedure/create', procedureDto)

		return Procedure.fromPlain(data)
	}

	static async updateOne(id: number, procedure: Procedure) {
		if (procedure.nameVi) {
			procedure.nameEn = convertViToEn(procedure.nameVi)
		}
		const procedureDto = Procedure.toPlain(procedure)
		const { data } = await AxiosInstance.patch(`/procedure/update/${id}`, procedureDto)

		return Procedure.fromPlain(data)
	}
}
