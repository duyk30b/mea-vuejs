import { AxiosInstance } from '@/core/axios.instance'
import { OmitClass } from '@/utils'
import type { BaseResponse } from '../_base/base-dto'
import { Procedure } from '../procedure'
import { TicketProcedureGetQuery } from '../ticket-procedure'

export type StatisticTicketProcedureResponseType = {
  count: number
  procedureId: number
  procedure: Procedure
  sumQuantity: number
  sumActualAmount: number
}

export class StatisticTicketProcedureQuery extends OmitClass(TicketProcedureGetQuery, ['sort']) {
  sortStatistic?: { [P in keyof StatisticTicketProcedureResponseType]?: 'DESC' }

  static toQueryString(instance: Partial<StatisticTicketProcedureQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sortStatistic: instance.sortStatistic ? JSON.stringify(instance.sortStatistic) : undefined,
    }
  }
}

export class StatisticProcedureApi {
  static async statisticTicketProcedure(options: StatisticTicketProcedureQuery) {
    const params = StatisticTicketProcedureQuery.toQueryString(options)

    const response = await AxiosInstance.get('/statistic/procedure/statistic-ticket-procedure', {
      params,
    })
    const { data } = response.data as BaseResponse<{
      statisticPagination: any[]
      statisticTotal: any
    }>
    return {
      statisticPagination: data.statisticPagination.map((i) => {
        const item: StatisticTicketProcedureResponseType = {
          count: i.count as number,
          procedureId: i.procedureId as number,
          procedure: Procedure.from(i.procedure),
          sumQuantity: i.sumQuantity as number,
          sumActualAmount: i.sumActualAmount as number,
        }
        return item
      }),
      statisticTotal: {
        count: data.statisticTotal.count,
        sumActualAmount: data.statisticTotal.sumActualAmount,
      },
    }
  }
}
