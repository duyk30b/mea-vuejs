import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Distributor } from '../distributor/distributor.model'
import type { ApiPaginationResponse } from '../pagination'
import {
  DistributorPaymentGetQuery,
  type DistributorPaymentPaginationQuery,
  type DistributorPaymentPayDebtBody,
} from './distributor-payment.dto'
import { DistributorPayment } from './distributor-payment.model'

export class DistributorPaymentApi {
  static async pagination(options: DistributorPaymentPaginationQuery) {
    const params = DistributorPaymentGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/distributor-payment/pagination', { params })
    const { data, meta } = response.data as BaseResponse

    return {
      meta,
      data: DistributorPayment.fromPlains(data),
    }
  }

  static async payDebt(body: DistributorPaymentPayDebtBody) {
    const response = await AxiosInstance.post('/distributor-payment/pay-debt', body)
    const { data, meta } = response.data as BaseResponse<{ distributor: any }>
    const distributor = Distributor.fromPlain(data.distributor)

    return { distributor }
  }
}
