import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray, ESString } from '../../utils'
import { WalletApi } from './wallet.api'
import type { WalletDetailQuery, WalletListQuery, WalletPaginationQuery } from './wallet.dto'
import { Wallet } from './wallet.model'

const WalletDBQuery = new IndexedDBQuery<Wallet>()

export class WalletService {
  static loadedAll: boolean = false

  static walletAll: Wallet[] = []
  static walletMap = ref<Record<string, Wallet>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const walletAll = await WalletApi.list({ sort: { id: 'ASC' } })
        WalletService.walletAll = walletAll
        WalletService.walletMap.value = ESArray.arrayToKeyValue(walletAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ wallet.service.ts:21 ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !WalletService.loadedAll || options.refetch) {
        WalletService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: Wallet[], query: WalletPaginationQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return WalletDBQuery.executeFilter(i, filter)
      })
    }
    if (query.sort) {
      data = WalletDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async pagination(query: WalletPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await WalletService.fetchAll({ refetch: !!options?.refetch })
    
    const dataQuery = WalletService.executeQuery(WalletService.walletAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      walletList: data,
      total: dataQuery.length,
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await WalletService.fetchAll({ refetch: !!options?.refetch })
    return WalletService.walletMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await WalletService.fetchAll({ refetch: !!options?.refetch })
    return WalletService.walletAll
  }

  static async list(query: WalletListQuery) {
    await WalletService.fetchAll()
    const data = WalletService.executeQuery(WalletService.walletAll, query)

    return Wallet.fromList(data)
  }

  static async detail(id: string, options: WalletDetailQuery = {}) {
    const wallet = await WalletApi.detail(id, options)
    if (wallet) {
      const findIndex = WalletService.walletAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        WalletService.walletAll[findIndex] = wallet
      }
    }
    return wallet
  }

  static async createOne(wallet: Wallet, options?: {}) {
    const result = await WalletApi.createOne(wallet)
    WalletService.loadedAll = false
    return result
  }

  static async updateOne(id: string, wallet: Partial<Wallet>, options?: {}) {
    const result = await WalletApi.updateOne(id, wallet)
    WalletService.loadedAll = false
    return result
  }

  static async destroyOne(id: string, options?: {}) {
    const result = await WalletApi.destroyOne(id)
    WalletService.loadedAll = false
    return result
  }

  static async search(text: string) {
    if (!text) text = ''
    return WalletService.walletAll.filter((i) => {
      return ESString.customFilter(i.name, text)
    })
  }
}
