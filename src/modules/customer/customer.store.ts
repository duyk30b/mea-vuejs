import { RefreshTimeDB } from '@/core/indexed-db/repository/refresh-time.repository'
import { defineStore } from 'pinia'
import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { CustomerPaymentService, type CustomerPaymentPayDebtBody } from './customer-payment.service'
import { CustomerApi } from './customer.api'
import type { CustomerPaginationQuery } from './customer.dto'
import type { Customer } from './customer.model'

export const useCustomerStore = defineStore('customer-store', {
  state: () => {
    return { customerList: [] as Customer[] }
  },

  actions: {
    async refreshDB() {
      try {
        let refreshTime = await RefreshTimeDB.getOneByCode('CUSTOMER')
        if (!refreshTime) {
          refreshTime = { code: 'CUSTOMER', time: new Date(0).toISOString() }
        }
        const lastTime = new Date(refreshTime.time)
        const currentTime = new Date()
        const customerList = await CustomerApi.list({
          filter: { updatedAt: { GTE: lastTime, LT: currentTime } },
        })
        if (customerList.length) {
          await CustomerDB.upsertMany(customerList)
        }

        refreshTime.time = currentTime.toISOString()
        await RefreshTimeDB.upsertOne(refreshTime)
      } catch (error) {
        console.log('🚀 ~ file: customer.store.ts:33 ~ refreshDB ~ error:', error)
      }
    },

    async pagination(params: CustomerPaginationQuery) {
      return await CustomerDB.pagination(params)
    },

    async createOne(customer: Customer) {
      const response = await CustomerApi.createOne(customer)
      await CustomerDB.insertOne(response)
      return response
    },

    async updateOne(id: number, data: Customer) {
      const response = await CustomerApi.updateOne(id, data)
      await CustomerDB.updateOne(response)
      return response
    },

    async payDebt(body: CustomerPaymentPayDebtBody) {
      const data = await CustomerPaymentService.payDebt(body)
      await CustomerDB.updateOne(data.customer)
      return data
    },

    async deleteOne(id: number) {
      await CustomerApi.deleteOne(id)
      await CustomerDB.deleteOneById(id)
    },

    async search(text: string) {
      return await CustomerDB.search(text)
    },
  },
})
