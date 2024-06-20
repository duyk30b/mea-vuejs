import { defineStore } from 'pinia'
import { DistributorDB } from '../../core/indexed-db/repository/distributor.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { DistributorPaymentApi } from '../distributor-payment/distributor-payment.api'
import type { DistributorPaymentPayDebtBody } from '../distributor-payment/distributor-payment.dto'
import { DistributorApi } from './distributor.api'
import type { DistributorPaginationQuery } from './distributor.dto'
import { Distributor } from './distributor.model'

export const useDistributorStore = defineStore('distributor-store', {
  state: () => {
    return {
      timeSync: Date.now(),
      distributorList: [] as Distributor[],
    }
  },

  actions: {
    async refreshDB() {
      let refreshTime = await RefreshTimeDB.findOneByCode('DISTRIBUTOR')
      if (!refreshTime) {
        refreshTime = { code: 'DISTRIBUTOR', time: new Date(0).toISOString() }
      }
      const lastTime = new Date(refreshTime.time)
      const { data, time } = await DistributorApi.list({
        filter: { updatedAt: { GTE: lastTime } },
      })
      if (data.length) {
        await DistributorDB.upsertMany(data)
        refreshTime.time = time.toISOString()
        await RefreshTimeDB.upsertOne(refreshTime)
      }

      return data
    },

    async pagination(params: DistributorPaginationQuery) {
      const { page, limit, relation, filter, sort } = params
      const result = await DistributorDB.pagination({
        page: page || 1,
        limit: limit || 10,
        condition: {
          isActive: filter?.isActive,
          debt: filter?.debt,
          $OR: filter?.searchText
            ? [{ fullName: { LIKE: filter?.searchText } }, { phone: { LIKE: filter?.searchText } }]
            : undefined,
          deletedAt: { IS_NULL: true },
        },
        sort: sort || { id: 'DESC' },
      })
      return {
        total: result.total,
        page: result.page,
        limit: result.limit,
        data: Distributor.toBasics(result.data),
      }
    },

    async getOne(id: number) {
      const distributor = await DistributorDB.findOneByKey(id)
      return distributor ? Distributor.toBasic(distributor) : null
    },

    async createOne(instance: Distributor) {
      const response = await DistributorApi.createOne(instance)
      await DistributorDB.insertOne(response)
      this.timeSync = Date.now()
      return response
    },

    async updateOne(id: number, instance: Distributor) {
      const response = await DistributorApi.updateOne(id, instance)
      await DistributorDB.replaceOne(id, response)
      this.timeSync = Date.now()
      return response
    },

    async payDebt(body: DistributorPaymentPayDebtBody) {
      const response = await DistributorPaymentApi.payDebt(body)
      await DistributorDB.replaceOne(response.distributor.id, response.distributor)
      this.timeSync = Date.now()
      return response
    },

    async deleteOne(id: number) {
      const response = await DistributorApi.deleteOne(id)
      await DistributorDB.replaceOne(id, response)
      this.timeSync = Date.now()
      return response
    },

    async search(text: string) {
      if (!text) return []
      const objects = await DistributorDB.findManyBy({
        isActive: 1,
        $OR: [{ fullName: { LIKE: text } }, { phone: { LIKE: text } }],
        deletedAt: { IS_NULL: true },
      })
      return Distributor.toBasics(objects)
    },
  },
})
