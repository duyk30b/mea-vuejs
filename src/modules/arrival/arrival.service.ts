import { AxiosInstance } from '../../core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Arrival, type ArrivalStatus } from './arrival.model'

export interface ArrivalPaginationQuery extends ApiPaginationRequest {
  filter?: {
    customer_id?: number
    from_time?: number
    to_time?: number
    status?: ArrivalStatus
  }
  relation?: {
    customer?: boolean
  }
}

export class ArrivalService {
  static async pagination(params: ArrivalPaginationQuery) {
    const response = await AxiosInstance.get('/arrival/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Arrival.fromPlains(data.data),
    }
  }

  static async detail(id: number, relation?: { customer?: boolean }): Promise<Arrival> {
    const { data } = await AxiosInstance.get(`/arrival/detail/${id}`, {
      params: { relation: { customer: relation?.customer } },
    })
    return Arrival.fromPlain(data)
  }

  // static async onEventNewArrival(dto: Record<string, any>) {
  //   await ArrivalArrivalService.getAllArrivalToday()
  // }

  // static async getAllArrivalToday() {
  //   const { data } = await AxiosInstance.get('/arrival/list', {
  //     params: {
  //       from_time: new Date(new Date().toDateString()).getTime(),
  //       to_time: new Date(new Date().toDateString()).getTime() + 24 * 60 * 60 * 1000,
  //     },
  //   })

  //   const arrivalStore = useArrivalStore()
  //   const arrivals = Arrival.fromPlains(data.data)
  //   arrivals.forEach((arrival) => {
  //     arrivalStore.data[arrival.id as number] = arrival
  //   })
  // }
}
