import { AxiosInstance } from '@/core/axios.instance'
import type { FullResponse } from '../_base/base-dto'

export class StatisticService {
  static async statisticPurchaseOrder(params: {
    fromTime: string
    toTime: string
    timeType: 'date' | 'month'
  }) {
    const response = await AxiosInstance.get('/statistic/statistic-purchase-order', { params })
    const { data } = response.data as FullResponse<
      Record<
        string,
        {
          sumDiscountMoney: number
          sumTotalMoney: number
          sumDebt: number
          countPurchaseOrder: number
        }
      >
    >
    return Object.entries(data).map(([key, value]) => ({ timeLabel: key, ...value }))
  }
}
