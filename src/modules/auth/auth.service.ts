import axios from 'axios'
import { CONFIG } from '../../config'
import { MeaDatabase } from '../../core/indexed-db/database'
import { LocalStorageService } from '../../core/local-storage.service'
import { User } from '../user'
import { useUserStore } from '../user/user.store'

export type LoginDto = {
  orgPhone: string
  username: string
  password: string
}

export type RegisterDto = {
  phone: string
  email: string
  username: string
  password: string
}

export class AuthApi {
  static async register(body: RegisterDto) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/register`, body)
    const data = response.data as {
      user: User
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }

    LocalStorageService.setAuth(data)
    useUserStore().userInfo = User.fromPlain(data.user)
  }

  static async login(body: LoginDto) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/login`, body)
    const data = response.data as {
      user: User
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }
    LocalStorageService.setAuth(data)
    useUserStore().userInfo = User.fromPlain(data.user)
  }

  static async loginDemo() {
    const response = await axios.post(`${CONFIG.API_URL}/auth/login-demo`)
    const data = response.data as {
      user: User
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }
    LocalStorageService.setAuth(data)
    useUserStore().userInfo = User.fromPlain(data.user)
    // reconnectSocket()
  }

  static async forgotPassword(body: { orgPhone: string; email: string; username: string }) {
    const { data } = await axios.post(`${CONFIG.API_URL}/auth/forgot-password`, body)
    return data as { success: boolean }
  }

  static async resetPassword(body: {
    orgPhone: string
    username: string
    password: string
    token: string
  }) {
    const { data } = await axios.post(`${CONFIG.API_URL}/auth/reset-password`, body)
    return data as { success: boolean }
  }

  static async refreshToken(refreshToken: string) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/refresh-password`, { refreshToken })
    return response.data as { accessToken: string; accessExp: number }
  }

  static async logout() {
    await MeaDatabase.destroy()
    LocalStorageService.removeAuth()
    useUserStore().userInfo = null
  }
}
