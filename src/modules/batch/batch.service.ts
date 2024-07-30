import { BatchDB } from '../../core/indexed-db/repository/batch.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { useMeStore } from '../_me/me.store'
import { BatchApi } from './batch.api'
import type { BatchListQuery } from './batch.dto'
import { Batch } from './batch.model'

export class BatchService {
  static async refreshDB() {
    let refreshTime = await RefreshTimeDB.findOneByCode('BATCH')
    if (!refreshTime) {
      refreshTime = { code: 'BATCH', dataVersion: 0, time: new Date(0).toISOString() }
    }
    const dataVersion = useMeStore().organization.dataVersionParse.batch

    let apiResponse: { time: Date; data: Batch[] }

    if (refreshTime.dataVersion !== dataVersion) {
      await BatchDB.truncate()
      apiResponse = await BatchApi.list({})
    } else {
      const lastTime = new Date(refreshTime.time)
      apiResponse = await BatchApi.list({
        filter: { updatedAt: { GTE: lastTime } },
      })
    }

    if (apiResponse.data.length) {
      await BatchDB.upsertMany(apiResponse.data)
      refreshTime.time = apiResponse.time.toISOString()
      refreshTime.dataVersion = dataVersion
      await RefreshTimeDB.upsertOne(refreshTime)
    }

    return { numberChange: apiResponse.data.length }
  }

  static async list(params: BatchListQuery) {
    const { filter, limit, sort } = params
    const objects = await BatchDB.findMany({
      limit,
      condition: {
        expiryDate: filter?.expiryDate,
        quantity: filter?.quantity,
        productId: filter?.productId,
        $OR: filter?.$OR,
      },
      sort,
    })
    return Batch.fromList(objects)
  }

  static async updateOne(id: number, instance: Batch) {
    const response = await BatchApi.updateOne(id, instance)
    await BatchDB.replaceOne(id, response)
    return response
  }
}
