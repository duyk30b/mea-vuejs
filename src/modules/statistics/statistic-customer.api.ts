import { AxiosInstance } from '@/core/axios.instance'
import type { FullResponse } from '../_base/base-dto'

export class StatisticCustomerApi {
  static async sumCustomerDebt() {
    const response = await AxiosInstance.get('statistic/customer/sum-customer-debt')
    const { data } = response.data as FullResponse<{ customerSumDebt: number }>
    return data.customerSumDebt as number
  }
}
