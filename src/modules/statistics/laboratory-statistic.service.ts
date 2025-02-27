import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'

export class LaboratoryStatisticService {
  static async sumMoney(params: { fromTime?: string; toTime?: string }) {
    const response = await AxiosInstance.get('/statistic/ticket-laboratory/sum-money', { params })
    const { data } = response.data as BaseResponse<{
      sumCostMoney: number
      sumActualMoney: number
    }>
    return data
  }
}
