export interface ApiPaginationRequest {
	page: number,
	limit: number,
	filter?: Record<string, any>
	sort?: { id: 'ASC' | 'DESC' } | Record<string, 'ASC' | 'DESC'>
	relations?: { [P in string]?: boolean | Object }
}

export interface ApiPaginationResponse {
	total: number,
	page: number,
	limit: number,
	data: Record<string, any>[]
}
