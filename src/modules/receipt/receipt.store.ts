import { defineStore } from 'pinia'
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
  },
})
