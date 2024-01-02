import { defineStore } from 'pinia'
import { DistributorDB } from '../../core/indexed-db/repository/distributor.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import {
  DistributorPaymentService,
  type DistributorPaymentPayDebtBody,
} from './distributor-payment.service'
import { DistributorApi } from './distributor.api'
import type { DistributorPaginationQuery } from './distributor.dto'
import type { Distributor } from './distributor.model'

export const useDistributorStore = defineStore('distributor-store', {
  state: () => {
    return { distributorList: [] as Distributor[] }
  },

  actions: {
    async refreshDB() {
      try {
        let refreshTime = await RefreshTimeDB.getOneByCode('DISTRIBUTOR')
        if (!refreshTime) {
          refreshTime = { code: 'DISTRIBUTOR', time: new Date(0).toISOString() }
        }
        const lastTime = new Date(refreshTime.time)
        const currentTime = new Date()
        const distributorList = await DistributorApi.list({
          filter: { updatedAt: { GTE: lastTime, LT: currentTime } },
        })
        if (distributorList.length) {
          await DistributorDB.upsertMany(distributorList)
        }

        refreshTime.time = currentTime.toISOString()
        await RefreshTimeDB.upsertOne(refreshTime)
      } catch (error) {
        console.log('🚀 ~ file: customer.store.ts:33 ~ refreshDB ~ error:', error)
      }
    },

    async pagination(params: DistributorPaginationQuery) {
      return await DistributorDB.pagination(params)
    },

    async createOne(customer: Distributor) {
      const response = await DistributorApi.createOne(customer)
      await DistributorDB.insertOne(response)
      return response
    },

    async updateOne(id: number, data: Distributor) {
      const response = await DistributorApi.updateOne(id, data)
      await DistributorDB.updateOne(response)
      return response
    },

    async payDebt(body: DistributorPaymentPayDebtBody) {
      const data = await DistributorPaymentService.payDebt(body)
      await DistributorDB.updateOne(data.distributor)
      return data
    },

    async deleteOne(id: number) {
      await DistributorApi.deleteOne(id)
      await DistributorDB.deleteOneById(id)
    },

    async search(text: string) {
      return await DistributorDB.search(text)
    },
  },
})
