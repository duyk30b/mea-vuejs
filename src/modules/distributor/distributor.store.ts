import { defineStore } from 'pinia'
import { DistributorDB } from '../../core/indexed-db/repository/distributor.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { useMeStore } from '../_me/me.store'
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
        refreshTime = {
          code: 'DISTRIBUTOR',
          dataVersion: 0,
          time: new Date(0).toISOString(),
        }
      }
      const dataVersion = useMeStore().organization.dataVersion

      let apiResponse: { time: Date; data: Distributor[] }
      let hasChange = false

      if (refreshTime.dataVersion !== dataVersion) {
        hasChange = true
        await DistributorDB.truncate()
        apiResponse = await DistributorApi.list({})
      } else {
        const lastTime = new Date(refreshTime.time)
        apiResponse = await DistributorApi.list({
          filter: { updatedAt: { GTE: lastTime } },
        })
      }

      if (apiResponse.data.length) {
        await DistributorDB.upsertMany(apiResponse.data)
      }
      refreshTime.time = apiResponse.time.toISOString()
      refreshTime.dataVersion = dataVersion
      await RefreshTimeDB.upsertOne(refreshTime)

      return {
        hasChange: hasChange || !!apiResponse.data.length,
      }
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
        data: Distributor.fromList(result.data),
      }
    },

    async getOne(id: number) {
      const distributor = await DistributorDB.findOneByKey(id)
      return distributor ? Distributor.from(distributor) : null
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
      return Distributor.fromList(objects)
    },
  },
})
