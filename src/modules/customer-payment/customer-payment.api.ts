import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer/customer.model'
import { Invoice } from '../invoice'
import { Visit } from '../visit'
import {
  CustomerPaymentGetQuery,
  CustomerPaymentListQuery,
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

  static async list(options: CustomerPaymentListQuery) {
    const params = CustomerPaymentGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer-payment/list', { params })
    const { data } = response.data as BaseResponse
    return CustomerPayment.fromPlains(data)
  }

  static async voucherDebtList(customerId: number) {
    const response = await AxiosInstance.get('/customer-payment/voucher-debt-list', {
      params: { customerId },
    })

    const { data } = response.data as BaseResponse<{
      invoiceBasicList: any[]
      visitBasicList: any[]
    }>
    return {
      invoiceBasicList: Invoice.toBasics(data.invoiceBasicList),
      visitBasicList: Visit.toBasics(data.visitBasicList),
    }
  }

  static async payDebt(body: CustomerPaymentPayDebtBody) {
    const response = await AxiosInstance.post('/customer-payment/pay-debt', body)
    const { data } = response.data as BaseResponse<{ customer: any }>

    const customer = Customer.fromPlain(data.customer)

    return { customer }
  }
}
