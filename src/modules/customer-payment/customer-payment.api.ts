import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer/customer.model'
import type { ApiPaginationResponse } from '../pagination'
import {
  CustomerPaymentGetQuery,
  type CustomerPaymentPaginationQuery,
  type CustomerPaymentPayDebtBody,
} from './customer-payment.dto'
import { CustomerPayment } from './customer-payment.model'

export class CustomerPaymentApi {
  static async pagination(options: CustomerPaymentPaginationQuery) {
    const params = CustomerPaymentGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer-payment/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: CustomerPayment.fromPlains(data),
    }
  }

  static async payDebt(body: CustomerPaymentPayDebtBody) {
    const response = await AxiosInstance.post('/customer-payment/pay-debt', body)
    const { data } = response.data as BaseResponse<{ customer: any }>

    const customer = Customer.fromPlain(data.customer)

    return { customer }
  }
}
