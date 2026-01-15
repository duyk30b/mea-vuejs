import axios from 'axios'
import { CONFIG } from '../../config'
import type { FullResponse } from '../_base/base-dto'
import { User } from '../user'
import type { LoginDto, LoginRootDto, RegisterDto } from './auth.dto'

export class AuthApi {
  static async register(body: RegisterDto) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/register`, body)
    const { data } = response.data as FullResponse<{
      user: any
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }>
    return {
      user: User.from(data.user),
      accessToken: data.accessToken as string,
      accessExp: data.accessExp as number,
      refreshToken: data.refreshToken as string,
      refreshExp: data.refreshExp as number,
    }
  }

  static async login(body: LoginDto) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/login`, body)
    const { data } = response.data as FullResponse<{
      user: any
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }>
    return {
      user: User.from(data.user),
      accessToken: data.accessToken as string,
      accessExp: data.accessExp as number,
      refreshToken: data.refreshToken as string,
      refreshExp: data.refreshExp as number,
    }
  }

  static async loginRoot(body: LoginRootDto) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/login-root`, body)
    const { data } = response.data as FullResponse<{
      user: any
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }>
    return {
      user: User.from(data.user),
      accessToken: data.accessToken as string,
      accessExp: data.accessExp as number,
      refreshToken: data.refreshToken as string,
      refreshExp: data.refreshExp as number,
    }
  }

  static async loginDemo() {
    const response = await axios.post(`${CONFIG.API_URL}/auth/login-demo`)
    const { data } = response.data as FullResponse<{
      user: any
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }>
    return {
      user: User.from(data.user),
      accessToken: data.accessToken as string,
      accessExp: data.accessExp as number,
      refreshToken: data.refreshToken as string,
      refreshExp: data.refreshExp as number,
    }
  }

  static async forgotPassword(body: {
    organizationCode: string
    organizationEmail: string
    username: string
  }) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/forgot-password`, body)
    const { data, message } = response.data as FullResponse<boolean>
    return { data, message }
  }

  static async resetPassword(body: {
    organizationCode: string
    username: string
    password: string
    token: string
    updatedAt: number
  }) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/reset-password`, body)
    const { data } = response.data as FullResponse<boolean>
    return data
  }

  static async refreshToken(refreshToken: string) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/refresh-token`, { refreshToken })
    const { data } = response.data as FullResponse<{ accessToken: string; accessExp: number }>
    return data
  }

  static async logout(body: { oid: number; uid: number; clientId: string }) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/logout`, body)
    const { data } = response.data as FullResponse<boolean>
    return data
  }
}
