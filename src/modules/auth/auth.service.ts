import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { MeaDatabase } from '../../core/indexed-db/database'
import { LocalStorageService } from '../../core/local-storage.service'
import { reconnectSocket } from '../../core/socket/socket.base'
import { useMeStore } from '../_me/me.store'
import { AuthApi } from './auth.api'
import type { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto'

export class AuthService {
  static async register(body: RegisterDto) {
    try {
      const data = await AuthApi.register(body)
      LocalStorageService.setToken(data)
      LocalStorageService.setOrgPhone(data.user?.organization?.phone || '')
      useMeStore().user = data.user
      reconnectSocket()
      return true
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || error?.config.signal?.reason
      AlertStore.addError(message)
    }
  }

  static async login(body: LoginDto) {
    try {
      const data = await AuthApi.login(body)
      LocalStorageService.setToken(data)
      LocalStorageService.setOrgPhone(data.user?.organization?.phone || '')
      useMeStore().user = data.user
      reconnectSocket()
      return true
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || error?.config.signal?.reason
      AlertStore.addError(message)
    }
  }

  static async loginDemo() {
    try {
      const data = await AuthApi.loginDemo()
      LocalStorageService.setToken(data)
      // LocalStorageService.setOrgPhone(data.user?.organization?.phone || '')
      useMeStore().user = data.user
      reconnectSocket()
      return true
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || error?.config.signal?.reason
      AlertStore.addError(message)
    }
  }

  static async forgotPassword(body: ForgotPasswordDto) {
    try {
      const { data, message } = await AuthApi.forgotPassword(body)
      AlertStore.addSuccess(message)
      return { data, message }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || error?.config.signal?.reason
      AlertStore.addError(message)
    }
  }

  static async resetPassword(body: ResetPasswordDto) {
    try {
      return await AuthApi.resetPassword(body)
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || error?.config.signal?.reason
      AlertStore.addError(message)
    }
  }

  static async logout() {
    const refreshToken = LocalStorageService.getRefreshToken()
    if (refreshToken) {
      try {
        await AuthApi.logout(refreshToken)
      } catch (error: any) {
        const message =
          error?.response?.data?.message || error.message || error?.config.signal?.reason
        AlertStore.addError(message)
      }
    }
    await MeaDatabase.destroy()
    LocalStorageService.removeToken()
    useMeStore().user = null
  }

  static getAccessToken = (() => {
    const start = async () => {
      try {
        const refreshToken = LocalStorageService.getRefreshToken()
        if (!refreshToken) throw new Error()
        const data = await AuthApi.refreshToken(refreshToken)
        LocalStorageService.setAccessToken(data)
      } catch (error: any) {
        const message =
          error?.response?.data?.message || error.message || error?.config.signal?.reason
        AlertStore.addError(message)
        await AuthService.logout()
      }
    }
    let fetching: any = null
    return async () => {
      if (!fetching) fetching = start()
      await fetching
      fetching = null
    }
  })()
}
