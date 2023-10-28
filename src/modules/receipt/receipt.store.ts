import { defineStore } from 'pinia'
import { ReceiptApi } from './receipt.api'
import type { ReceiptPaginationQuery } from './receipt.dto'
import type { ProductAndBatchUpsertBody } from '../receipt-item/receipt-item.dto'
import { DTimer } from '../../utils'
import { ReceiptItemApi } from '../receipt-item/receipt-item.api'
import { useProductStore } from '../product'
import { useBatchStore } from '../batch'
import { BatchDB } from '../../core/indexed-db/repository/batch.repository'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'

export const useReceiptStore = defineStore('receipt-store', {
  state: () => {
    return {
      timeSync: Date.now(),
    }
  },

  actions: {
    async pagination(params: ReceiptPaginationQuery) {
      return await ReceiptApi.pagination(params)
    },

    async upsertProductAndBatch(body: ProductAndBatchUpsertBody) {
      if (body.batch) {
        if (!body.batch.lotNumber && body.batch.expiryDate) {
          body.batch.lotNumber = DTimer.timeToText(body.batch.expiryDate, 'YYYYMMDD')
        }
      }
      const data = await ReceiptItemApi.upsertProductAndBatch(body)
      if (data.product) {
        await ProductDB.replaceOne(data.product.id, data.product)
        useProductStore().timeSync = Date.now()
      }
      if (data.batch) {
        await BatchDB.upsertOne(data.batch)
        useBatchStore().timeSync = Date.now()
      }
      return data
    },
  },
})
