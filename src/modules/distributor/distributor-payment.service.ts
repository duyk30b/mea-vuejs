import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { DistributorPayment } from './distributor-payment.model'
import { Distributor } from './distributor.model'

export interface DistributorPaymentPaginationQuery extends ApiPaginationRequest {
  filter: { distributorId: number }
}

export interface DistributorPaymentPayDebtBody {
  distributorId: number
  note: string
  receiptPayments: { receiptId: number; money: number }[]
}

export class DistributorPaymentService {
  static async pagination(params: DistributorPaymentPaginationQuery) {
    const response = await AxiosInstance.get('/distributor-payment/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: DistributorPayment.fromPlains(data.data),
    }
  }

  static async payDebt(body: DistributorPaymentPayDebtBody) {
    const { data } = await AxiosInstance.post('/distributor-payment/pay-debt', body)
    const distributor = Distributor.fromPlain(data.distributor)

    return { distributor }
  }
}
