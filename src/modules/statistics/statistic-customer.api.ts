import { AxiosInstance } from '@/core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'

export class StatisticCustomerApi {
  static async sumCustomerDebt() {
    const response = await AxiosInstance.get('statistic/customer/sum-customer-debt')
    const { data } = response.data as BaseResponse<{ customerSumDebt: number }>
    return data.customerSumDebt as number
  }
}
