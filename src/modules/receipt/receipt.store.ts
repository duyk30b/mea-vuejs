import { defineStore } from 'pinia'
import { DTimer } from '../../utils'
import { ReceiptItemApi } from '../receipt-item/receipt-item.api'
import type { ProductAndBatchUpsertBody } from '../receipt-item/receipt-item.dto'
import { ReceiptApi } from './receipt.api'
import type { ReceiptPaginationQuery } from './receipt.dto'

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
          body.batch.lotNumber = DTimer.timeToText(body.batch.expiryDate, 'DDMMYYYY')
        }
      }
      const data = await ReceiptItemApi.upsertProductAndBatch(body)
      return data
    },
  },
})
