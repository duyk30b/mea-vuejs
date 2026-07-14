import { AxiosInstance } from '@/core/axios.instance'
import { OmitClass } from '@/utils'
import type { FullResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import { TicketGetQuery, type TicketFilterQuery } from '../ticket'
import { CustomerGroup } from '../customer_group'

export type StatisticTicketResponseType = {
  countTicket: number
  sumItemsCostAmount: number
  sumExpense: number
  sumSurcharge: number
  sumTotalMoney: number
  sumProfit: number
  sumPaidTotal: number
  sumDebtTotal: number
}

export type StatisticTicketQueryCustomerResponseType = StatisticTicketResponseType & {
  customerId: number
  customer: Customer
}

export type StatisticTicketQueryCustomerGroupResponseType = StatisticTicketResponseType & {
  customerGroupId: string
  customerGroup: CustomerGroup
}

export type StatisticTicketQueryTimeResponseType = {
  timeLabel: string
  year: number
  month: number
  data: number
  countTicket: number
  sumTotalMoney: number
  sumItemsCostAmount: number
  sumProcedureMoney: number
  sumProductMoney: number
  sumRadiologyMoney: number
  sumLaboratoryMoney: number
  sumDiscountMoney: number
  sumItemsDiscount: number
  sumSurcharge: number
  sumExpense: number
  sumProfit: number
  sumPaidTotal: number
  sumDebtTotal: number
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
    const response = await AxiosInstance.get('statistic/ticket/group_by_customer', {
      params,
    })
    const { data } = response.data as FullResponse<{ statisticData: any[] }>

    return {
      statisticData: data.statisticData.map((i: any) => {
        const item: StatisticTicketQueryCustomerResponseType = {
          customerId: i.customerId as number,
          countTicket: i.countTicket as number,
          sumItemsCostAmount: i.sumItemsCostAmount as number,
          sumExpense: i.sumExpense as number,
          sumSurcharge: i.sumSurcharge as number,
          sumTotalMoney: i.sumTotalMoney as number,
          sumProfit: i.sumProfit as number,
          sumPaidTotal: i.sumPaidTotal as number,
          sumDebtTotal: i.sumDebtTotal as number,
          customer: Customer.from(i.customer),
        }
        return item
      }),
    }
  }

  static async groupByCustomerGroup(options: StatisticTicketQuery) {
    const params = StatisticTicketQuery.toQueryString(options)
    const response = await AxiosInstance.get('statistic/ticket/group_by_customer_group', {
      params,
    })
    const { data } = response.data as FullResponse<{ statisticData: any[] }>

    return {
      statisticData: data.statisticData.map((i: any) => {
        const item: StatisticTicketQueryCustomerGroupResponseType = {
          customerGroupId: i.customerGroupId as string,
          countTicket: i.countTicket as number,
          sumItemsCostAmount: i.sumItemsCostAmount as number,
          sumExpense: i.sumExpense as number,
          sumSurcharge: i.sumSurcharge as number,
          sumTotalMoney: i.sumTotalMoney as number,
          sumProfit: i.sumProfit as number,
          sumPaidTotal: i.sumPaidTotal as number,
          sumDebtTotal: i.sumDebtTotal as number,
          customerGroup: CustomerGroup.from(i.customerGroup || CustomerGroup.from({ id: i.customerGroupId, name: 'Chưa phân nhóm', updatedAt: 0 })),
        }
        return item
      }),
    }
  }

  static async groupByTime(options: {
    filter: TicketFilterQuery
    fromTime: string
    toTime: string
    groupTimeType: 'date' | 'month'
  }) {
    const filter = TicketGetQuery.toQuery(options)
    const response = await AxiosInstance.get('/statistic/ticket/group_by_time', {
      params: {
        filter: JSON.stringify(options.filter),
        fromTime: options.fromTime,
        toTime: options.toTime,
        groupTimeType: options.groupTimeType,
      },
    })
    const { data } = response.data as FullResponse<{
      statisticData: Record<string, Omit<StatisticTicketQueryTimeResponseType, 'timeLabel'>>
    }>
    return Object.entries(data.statisticData).map(([key, value]) => ({ timeLabel: key, ...value }))
  }
}
