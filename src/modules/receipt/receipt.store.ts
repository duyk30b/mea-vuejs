import { defineStore } from 'pinia'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { ReceiptApi } from './receipt.api'
import type { ReceiptPaginationQuery } from './receipt.dto'
import type { Receipt } from './receipt.model'

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
  },
})
