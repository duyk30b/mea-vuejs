import { AxiosInstance } from '@/core/axios.instance'
import { OmitClass } from '@/utils'
import type { BaseResponse } from '../_base/base-dto'
import { Laboratory } from '../laboratory'
import { TicketLaboratoryGetQuery } from '../ticket-laboratory'

export type StatisticTicketLaboratoryResponseType = {
  count: number
  laboratoryId: number
  laboratory: Laboratory
  sumCostAmount: number
  sumActualAmount: number
}

export class StatisticTicketLaboratoryQuery extends OmitClass(TicketLaboratoryGetQuery, ['sort']) {
  sortStatistic?: { [P in keyof StatisticTicketLaboratoryResponseType]?: 'DESC' }

  static toQueryString(instance: Partial<StatisticTicketLaboratoryQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sortStatistic: instance.sortStatistic ? JSON.stringify(instance.sortStatistic) : undefined,
    }
  }
}

export class StatisticLaboratoryApi {
  static async statisticTicketLaboratory(options: StatisticTicketLaboratoryQuery) {
    const params = StatisticTicketLaboratoryQuery.toQueryString(options)

    const response = await AxiosInstance.get('/statistic/laboratory/statistic-ticket-laboratory', {
      params,
    })
    const { data } = response.data as BaseResponse<{
      statisticPagination: any[]
      statisticTotal: any
    }>
    return {
      statisticPagination: data.statisticPagination.map((i) => {
        const item: StatisticTicketLaboratoryResponseType = {
          count: i.count as number,
          laboratoryId: i.laboratoryId as number,
          laboratory: Laboratory.from(i.laboratory),
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
