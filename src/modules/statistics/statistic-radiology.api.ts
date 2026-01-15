import { AxiosInstance } from '@/core/axios.instance'
import { OmitClass } from '@/utils'
import type { FullResponse } from '../_base/base-dto'
import { Radiology } from '../radiology'
import { TicketRadiologyGetQuery } from '../ticket-radiology'

export type StatisticTicketRadiologyResponseType = {
  count: number
  radiologyId: number
  radiology: Radiology
  sumCostAmount: number
  sumActualAmount: number
}

export class StatisticTicketRadiologyQuery extends OmitClass(TicketRadiologyGetQuery, ['sort']) {
  sortStatistic?: { [P in keyof StatisticTicketRadiologyResponseType]?: 'DESC' }

  static toQueryString(instance: Partial<StatisticTicketRadiologyQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sortStatistic: instance.sortStatistic ? JSON.stringify(instance.sortStatistic) : undefined,
    }
  }
}

export class StatisticRadiologyApi {
  static async statisticTicketRadiology(options: StatisticTicketRadiologyQuery) {
    const params = StatisticTicketRadiologyQuery.toQueryString(options)

    const response = await AxiosInstance.get('/statistic/radiology/statistic-ticket-radiology', {
      params,
    })
    const { data } = response.data as FullResponse<{
      statisticPagination: any[]
      statisticTotal: any
    }>
    return {
      statisticPagination: data.statisticPagination.map((i) => {
        const item: StatisticTicketRadiologyResponseType = {
          count: i.count as number,
          radiologyId: i.radiologyId as number,
          radiology: Radiology.from(i.radiology),
          sumCostAmount: i.sumCostAmount as number,
          sumActualAmount: i.sumActualAmount as number,
        }
        return item
      }),
      statisticTotal: {
        count: data.statisticTotal.count,
        sumCostAmount: data.statisticTotal.sumCostAmount,
        sumActualAmount: data.statisticTotal.sumActualAmount,
      },
    }
  }
}
