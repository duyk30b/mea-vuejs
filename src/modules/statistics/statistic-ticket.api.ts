import { AxiosInstance } from '@/core/axios.instance'
import { OmitClass } from '@/utils'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import { TicketGetQuery, type TicketFilterQuery } from '../ticket'

export type StatisticTicketResponseType = {
  customerId: number
  countTicket: number
  sumItemsCostAmount: number
  sumExpense: number
  sumSurcharge: number
  sumTotalMoney: number
  sumProfit: number
  sumDebt: number
  customer?: Customer
}

export class StatisticTicketQuery extends OmitClass(TicketGetQuery, ['sort']) {
  sortStatistic?: { [P in keyof StatisticTicketResponseType]?: 'DESC' }

  static toQueryString(instance: Partial<StatisticTicketQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sortStatistic: instance.sortStatistic ? JSON.stringify(instance.sortStatistic) : undefined,
    }
  }
}

export class StatisticTicketApi {
  static async groupByCustomer(options: StatisticTicketQuery) {
    const params = StatisticTicketQuery.toQueryString(options)
    const response = await AxiosInstance.get('statistic/ticket/group-by-customer', {
      params,
    })
    const { data } = response.data as BaseResponse<{ dataStatistic: any[] }>

    return {
      dataStatistic: data.dataStatistic.map((i: any) => {
        const item: StatisticTicketResponseType = {
          customerId: i.customerId as number,
          countTicket: i.countTicket as number,
          sumItemsCostAmount: i.sumItemsCostAmount as number,
          sumExpense: i.sumExpense as number,
          sumSurcharge: i.sumSurcharge as number,
          sumTotalMoney: i.sumTotalMoney as number,
          sumProfit: i.sumProfit as number,
          sumDebt: i.sumDebt as number,
          customer: Customer.from(i.customer),
        }
        return item
      }),
    }
  }

  static async statisticTicket(
    options: TicketFilterQuery & {
      fromTime: string
      toTime: string
      groupTimeType: 'date' | 'month'
    },
  ) {
    const filter = TicketGetQuery.toQuery(options)
    const response = await AxiosInstance.get('/statistic/ticket/statistic', {
      params: {
        ...filter,
        fromTime: options.fromTime,
        toTime: options.toTime,
        groupTimeType: options.groupTimeType,
      },
    })
    const { data } = response.data as BaseResponse<
      Record<
        string,
        {
          countTicket: number
          sumTotalMoney: number
          sumTotalCostAmount: number
          sumProcedureMoney: number
          sumProductMoney: number
          sumRadiologyMoney: number
          sumLaboratoryMoney: number
          sumSurcharge: number
          sumExpense: number
          sumDiscountMoney: number
          sumProfit: number
          sumDebt: number
        }
      >
    >
    return Object.entries(data).map(([key, value]) => ({ timeLabel: key, ...value }))
  }
}
