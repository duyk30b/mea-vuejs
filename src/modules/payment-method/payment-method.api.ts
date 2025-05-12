import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  PaymentMethodDetailQuery,
  PaymentMethodGetQuery,
  type PaymentMethodListQuery,
  type PaymentMethodPaginationQuery,
} from './payment-method.dto'
import { PaymentMethod } from './payment-method.model'

export class PaymentMethodApi {
  static async pagination(options: PaymentMethodPaginationQuery) {
    const params = PaymentMethodGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/payment-method/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: PaymentMethod.fromList(data),
    }
  }

  static async list(options: PaymentMethodListQuery) {
    const params = PaymentMethodGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/payment-method/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: PaymentMethod.fromList(data),
    }
  }

  static async detail(id: number, options: PaymentMethodDetailQuery = {}): Promise<PaymentMethod> {
    const params = PaymentMethodGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/payment-method/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ paymentMethod: any }>
    return PaymentMethod.from(data.paymentMethod)
  }

  static async createOne(paymentMethod: PaymentMethod) {
    const response = await AxiosInstance.post('/payment-method/create', {
      priority: paymentMethod.priority,
      name: paymentMethod.name,
      isActive: paymentMethod.isActive,
    })
    const { data } = response.data as BaseResponse<{ paymentMethod: any }>
    return PaymentMethod.from(data.paymentMethod)
  }

  static async updateOne(id: number, paymentMethod: Partial<PaymentMethod>) {
    const response = await AxiosInstance.patch(`/payment-method/update/${id}`, {
      priority: paymentMethod.priority,
      name: paymentMethod.name,
      isActive: paymentMethod.isActive,
    })
    const { data } = response.data as BaseResponse<{ paymentMethod: any }>
    return PaymentMethod.from(data.paymentMethod)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/payment-method/destroy/${id}`)
    const result = response.data as BaseResponse<{ paymentMethodId: number }>
    return result
  }
}
