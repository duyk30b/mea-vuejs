import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { CustomerPayment } from './customer-payment.model'
import { Customer } from './customer.model'

export interface CustomerPaymentPaginationQuery extends ApiPaginationRequest {
  filter: { customerId: number }
}

export interface CustomerPaymentPayDebtBody {
  customerId: number
  note: string
  invoicePayments: { invoiceId: number; money: number }[]
}

export class CustomerPaymentService {
  static async pagination(params: CustomerPaymentPaginationQuery) {
    const response = await AxiosInstance.get('/customer-payment/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: CustomerPayment.fromPlains(data.data),
    }
  }

  static async payDebt(body: CustomerPaymentPayDebtBody) {
    const { data } = await AxiosInstance.post('/customer-payment/pay-debt', body)
    const customer = Customer.fromPlain(data.customer)

    return { customer }
  }
}
