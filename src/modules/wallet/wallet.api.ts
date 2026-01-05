import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Wallet } from './'
import {
  WalletDetailQuery,
  WalletGetQuery,
  type WalletListQuery,
  type WalletPaginationQuery,
} from './wallet.dto'

export class WalletApi {
  static async pagination(options: WalletPaginationQuery) {
    const params = WalletGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/wallet/pagination', { params })
    const { data, meta } = response.data as BaseResponse
  }

  static async list(options: WalletListQuery) {
    const params = WalletGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/wallet/list', { params })
    const { data, time } = response.data as BaseResponse<{ walletList: any[] }>
    return Wallet.fromList(data.walletList)
  }

  static async detail(id: string, options: WalletDetailQuery = {}): Promise<Wallet> {
    const params = WalletGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/wallet/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ wallet: any }>
    return Wallet.from(data.wallet)
  }

  static async createOne(wallet: Wallet) {
    const response = await AxiosInstance.post('/wallet/create', {
      code: wallet.code,
      name: wallet.name,
      walletType: wallet.walletType,
      isActive: wallet.isActive,
    })
    const { data } = response.data as BaseResponse<{ wallet: any }>
    return Wallet.from(data.wallet)
  }

  static async updateOne(id: string, wallet: Partial<Wallet>) {
    const response = await AxiosInstance.post(`/wallet/update/${id}`, {
      code: wallet.code,
      name: wallet.name,
      walletType: wallet.walletType,
      isActive: wallet.isActive,
      money: wallet.money,
    })
    const { data } = response.data as BaseResponse<{ wallet: any }>
    return Wallet.from(data.wallet)
  }

  static async destroyOne(id: string) {
    const response = await AxiosInstance.post(`/wallet/destroy/${id}`)
    const result = response.data as BaseResponse<{ walletId: number }>
    return result
  }
}
