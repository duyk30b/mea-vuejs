import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { SettingKey } from '../_me/store.variable'

export class SettingApi {
  static async getMap() {
    const response = await AxiosInstance.get(`/setting/get-map`)
    const { data } = response.data as BaseResponse<{ settingMap: Record<any, any> }>
    return data
  }

  static async saveSettings(type: keyof typeof SettingKey, plain: string) {
    const response = await AxiosInstance.post(`/setting/upsert/${type}`, {
      data: plain,
    })
    const { data } = response.data as BaseResponse
    return data
  }

  static async loginGGDriver() {
    const response = await AxiosInstance.get('/setting/google-driver/get-auth-url')
    const { data } = response.data as BaseResponse<{ url: string }>
    return { url: data.url }
  }

  static async logoutGGDriver() {
    const response = await AxiosInstance.post('/setting/google-driver/logout')
    const { data } = response.data as BaseResponse
    return data
  }

  static async getAllAccountsGGDriver() {
    const response = await AxiosInstance.get('/setting/google-driver/get-all-accounts')
    const { data } = response.data as BaseResponse<any[]>
    return data
  }
}
