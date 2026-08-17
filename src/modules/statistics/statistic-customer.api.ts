import { AxiosInstance } from '@/core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { CustomerGroup } from '../customer_group'

export class StatisticCustomerApi {
  static async sumDebt() {
    const response = await AxiosInstance.get('statistic/customer/sum-debt')
    const { data } = response.data as FullResponse<{ customerSumDebt: number }>
    return data.customerSumDebt as number
  }

  static async groupByCustomerGroup() {
    const response = await AxiosInstance.get('statistic/customer/group-by-customer-group')
    const { data } = response.data as FullResponse<{ statisticData: any[] }>

    return {
      statisticData: data.statisticData.map((i: any) => {
        const item = {
          customerGroupId: i.customerGroupId,
          countCustomer: Number(i.countCustomer),
          sumDebt: Number(i.sumDebt),
          customerGroup: CustomerGroup.from(i.customerGroup || CustomerGroup.blank()),
        }
        return item
      }),
    }
  }
}
