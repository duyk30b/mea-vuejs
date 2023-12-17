import { CONFIG } from '@/config'
import { LocalStorageService } from '@/core/local-storage.service'
import { useUserStore } from '@/store/user.store'
import axios from 'axios'
import { Employee } from '../employee'

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

const userStore = useUserStore()

export class AuthService {
  static async register(body: RegisterDto) {
    const { data } = await axios.post(`${CONFIG.API_URL}/auth/register`, body)
    LocalStorageService.setAuth(data)
    userStore.userInfo = Employee.fromPlain(data.user)
  }

  static async login(body: LoginDto) {
    const { data } = await axios.post(`${CONFIG.API_URL}/auth/login`, body)
    LocalStorageService.setAuth(data)
    userStore.userInfo = Employee.fromPlain(data.user)
  }

  static async loginDemo() {
    const { data } = await axios.post(`${CONFIG.API_URL}/auth/login-demo`)
    LocalStorageService.setAuth(data)
    userStore.userInfo = Employee.fromPlain(data.user)
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

  static async logout() {
    LocalStorageService.removeAuth()
    userStore.userInfo = null
  }
}
