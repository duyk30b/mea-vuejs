import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { MeaDatabase } from '../../core/indexed-db/database'
import { LocalStorageService } from '../../core/local-storage.service'
import { reconnectSocket } from '../../core/socket/socket.base'
import { Router } from '../../router/router'
import { sleep } from '../../utils'
import { useMeStore } from '../_me/me.store'
import { AuthApi } from './auth.api'
import type { LoginDto, RegisterDto } from './auth.dto'

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

  static logout = (() => {
    const start = async () => {
      const refreshToken = LocalStorageService.getRefreshToken() // khai báo trước removeToken
      LocalStorageService.removeToken()
      useMeStore().user = null // khai báo trước Router push Login
      Router.push({ name: 'Login' })
      AlertStore.addError('Phiên đăng nhập đã kết thúc !')
      try {
        await MeaDatabase.destroy()
        if (refreshToken) {
          await AuthApi.logout(refreshToken)
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message || error.message || error?.config.signal?.reason
        AlertStore.addError(message)
      }
    }
    let fetching: any = null
    return async () => {
      if (!fetching) fetching = start()
      await fetching
      fetching = null
    }
  })()

  static refreshToken = (() => {
    const start = async () => {
      try {
        const refreshToken = LocalStorageService.getRefreshToken()
        if (!refreshToken) throw new Error()
        const data = await AuthApi.refreshToken(refreshToken)
        LocalStorageService.setAccessToken(data)
      } catch (error: any) {
        console.log('🚀 ~ file: auth.service.ts:111 ~ AuthService ~ start ~ error:', error)
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
