import { AlertStore } from '../../common/vue-alert'
import { IndexedDBQuery } from '../../core/indexed-db/_base/indexed-db.query'
import { BatchDB } from '../../core/indexed-db/repository/batch.repository'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { ESArray, ESObject } from '../../utils'
import { MeService } from '../_me/me.service'
import { AuthService } from '../auth/auth.service'
import { BatchApi } from './batch.api'
import type { BatchGetQuery, BatchListQuery, BatchPaginationQuery } from './batch.dto'
import { Batch } from './batch.model'

const BatchDBQuery = new IndexedDBQuery<Batch>()

export class BatchService {
  static async refreshDB() {
    try {
      let refreshTime = await RefreshTimeDB.findOneByCode('BATCH')
      if (!refreshTime) {
        refreshTime = { code: 'BATCH', dataVersion: 0, time: new Date(0).toISOString() }
      }
      const dataVersion = MeService.organization.value.dataVersionParse?.batch || 0

      let apiResponse: { time: Date; batchList: Batch[] }

      if (refreshTime.dataVersion !== dataVersion) {
        await BatchDB.truncate()
        apiResponse = await BatchApi.list({})
      } else {
        const lastTime = new Date(refreshTime.time)
        apiResponse = await BatchApi.list({
          filter: { updatedAt: { GTE: lastTime } },
        })
      }

      if (apiResponse.batchList.length) {
        await BatchDB.upsertMany(apiResponse.batchList)
        refreshTime.time = apiResponse.time.toISOString()
        refreshTime.dataVersion = dataVersion
        await RefreshTimeDB.upsertOne(refreshTime)
      }

      return { numberChange: apiResponse.batchList.length }
    } catch (error: any) {
      console.log('🚀 ~ file: product.service.ts:43 ~ BatchService ~ refreshDB ~ error:', error)
      AlertStore.add({ type: 'error', message: error.message })
      await AuthService.logout()
      location.reload()
      return
    }
  }

  private static async executeQuery(all: Batch[], query: BatchGetQuery) {
    let data = all

    if (query.relation) {
      if (query.relation.product) {
        const productAll = await ProductDB.findManyBy({})
        const productMap = ESArray.arrayToKeyValue(productAll, 'id')
        data.forEach((i) => (i.product = productMap[i.productId]))
      }
    }
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return BatchDBQuery.executeFilter(i, filter as any)
      })
    }

    if (query.sort) {
      data = BatchDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async pagination(query: BatchPaginationQuery, options?: { refresh: boolean }) {
    if (options?.refresh) {
      await BatchService.refreshDB()
    }
    const page = query.page || 1
    const limit = query.limit || 10
    const batchAll = await BatchDB.findAll()
    const dataTotal = await BatchService.executeQuery(batchAll, query)
    const data = dataTotal.slice((page - 1) * limit, page * limit)
    const batchList = Batch.fromList(data)
    return {
      page,
      limit,
      total: dataTotal.length,
      batchList,
    }
  }

  static async list(query: BatchListQuery, options?: { refresh: boolean }) {
    if (options?.refresh) {
      await BatchService.refreshDB()
    }
    // const { time, batchList } = await BatchApi.list(query)
    const { filter } = query
    const batchList = await BatchDB.findMany({
      limit: query.limit,
      condition: {
        id: filter?.id,
        productId: filter?.productId,
        quantity: filter?.quantity,
        $OR: filter?.$OR as any,
      },
      sort: query.sort,
    })
    return Batch.fromList(batchList)
  }

  static async updateInfo(id: number, instance: Batch) {
    const response = await BatchApi.updateInfo(id, instance)
    return response
  }

  static async updateInfoAndQuantityAndCostPrice(id: number, instance: Batch) {
    const response = await BatchApi.updateInfoAndQuantityAndCostPrice(id, instance)
    if (response.product) {
      await ProductDB.replaceOne(response.product.id, response.product)
    }
    if (response.batch) {
      await BatchDB.replaceOne(response.batch.id, response.batch)
    }
    return response
  }

  static async destroyOne(id: number) {
    const response = await BatchApi.destroyOne(id)
    if (response.success) {
      await BatchDB.deleteOneByKey(id)
    }
    return response
  }
}
