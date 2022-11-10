import { AxiosInstance } from '@/core/axios.instance'

export class StatisticsService {
	static async revenueMonth(params: { month: number, year: number }) {
		const response = await AxiosInstance.get('/statistics/revenue-month', { params })
		const data = response.data as {
			data: [{
				date?: number,
				from?: number,
				to: number,
				revenue: number
				profit: number
			}]
			month?: number,
			year?: number
		}
		return data
	}
}
