import { defineStore } from 'pinia'
import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { useMeStore } from '../_me/me.store'
import { CustomerPaymentApi } from '../customer-payment/customer-payment.api'
import type { CustomerPaymentPayDebtBody } from '../customer-payment/customer-payment.dto'
import { CustomerApi } from './customer.api'
import type { CustomerPaginationQuery } from './customer.dto'
import { Customer } from './customer.model'

export const useCustomerStore = defineStore('customer-store', {
  state: () => {
    return {
      timeSync: Date.now(),
      customerList: [] as Customer[],
    }
  },

  actions: {
    async refreshDB() {
      let refreshTime = await RefreshTimeDB.findOneByCode('CUSTOMER')
      if (!refreshTime) {
        refreshTime = {
          code: 'CUSTOMER',
          dataVersion: 0,
          time: new Date(0).toISOString(),
        }
      }
      const dataVersion = useMeStore().organization.dataVersion

      let apiResponse: { time: Date; data: Customer[] }
      let hasChange = false

      if (refreshTime.dataVersion !== dataVersion) {
        hasChange = true
        await CustomerDB.truncate()
        apiResponse = await CustomerApi.list({})
      } else {
        const lastTime = new Date(refreshTime.time)
        apiResponse = await CustomerApi.list({
          filter: { updatedAt: { GTE: lastTime } },
        })
      }

      if (apiResponse.data.length) {
        await CustomerDB.upsertMany(apiResponse.data)
      }
      refreshTime.time = apiResponse.time.toISOString()
      refreshTime.dataVersion = dataVersion
      await RefreshTimeDB.upsertOne(refreshTime)

      return {
        hasChange: hasChange || !!apiResponse.data.length,
      }
    },

    async pagination(params: CustomerPaginationQuery) {
      const { page, limit, filter, sort } = params
      const result = await CustomerDB.pagination({
        page: page || 1,
        limit: limit || 10,
        condition: {
          isActive: filter?.isActive,
          debt: filter?.debt,
          $OR: filter?.searchText
            ? [{ phone: { LIKE: filter?.searchText } }, { fullName: { LIKE: filter?.searchText } }]
            : undefined,
          deletedAt: { IS_NULL: true },
        },
        sort: sort || { id: 'DESC' },
      })
      return {
        total: result.total,
        page: result.page,
        limit: result.limit,
        data: Customer.fromList(result.data),
      }
    },

    async getOne(id: number) {
      const customer = await CustomerDB.findOneByKey(id)
      return customer ? Customer.from(customer) : null
    },

    async createOne(instance: Customer) {
      const response = await CustomerApi.createOne(instance)
      await CustomerDB.upsertOne(response)
      this.timeSync = Date.now()
      return response
    },

    async updateOne(id: number, instance: Customer) {
      const response = await CustomerApi.updateOne(id, instance)
      await CustomerDB.replaceOne(id, response)
      this.timeSync = Date.now()
      return response
    },

    async payDebt(body: CustomerPaymentPayDebtBody) {
      const data = await CustomerPaymentApi.payDebt(body)
      await CustomerDB.replaceOne(data.customer.id, data.customer)
      this.timeSync = Date.now()
      return data
    },

    async deleteOne(id: number) {
      const response = await CustomerApi.deleteOne(id)
      this.timeSync = Date.now()
      await CustomerDB.replaceOne(id, response)
      return response
    },

    async search(text: string) {
      if (!text) return []
      const objects = await CustomerDB.findManyBy({
        isActive: 1,
        $OR: [{ phone: { LIKE: text } }, { fullName: { LIKE: text } }],
        deletedAt: { IS_NULL: true },
      })
      return Customer.fromList(objects)
    },
  },
})
