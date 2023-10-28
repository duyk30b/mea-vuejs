import axios from 'axios'
import { CONFIG } from '../../config'
import type { BaseResponse } from '../_base/base-dto'
import { User } from '../user'
import type { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto'

export class AuthApi {
  static async register(body: RegisterDto) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/register`, body)
    const { data } = response.data as BaseResponse<{
      user: Record<string, any>
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }>
    return {
      user: User.fromPlain(data.user),
      accessToken: data.accessToken as string,
      accessExp: data.accessExp as number,
      refreshToken: data.refreshToken as string,
      refreshExp: data.refreshExp as number,
    }
  }

  static async login(body: LoginDto) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/login`, body)
    const { data } = response.data as BaseResponse<{
      user: Record<string, any>
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }>
    return {
      user: User.fromPlain(data.user),
      accessToken: data.accessToken as string,
      accessExp: data.accessExp as number,
      refreshToken: data.refreshToken as string,
      refreshExp: data.refreshExp as number,
    }
  }

  static async loginDemo() {
    const response = await axios.post(`${CONFIG.API_URL}/auth/login-demo`)
    const { data } = response.data as BaseResponse<{
      user: Record<string, any>
      accessToken: string
      accessExp: number
      refreshToken: string
      refreshExp: number
    }>
    return {
      user: User.fromPlain(data.user),
      accessToken: data.accessToken as string,
      accessExp: data.accessExp as number,
      refreshToken: data.refreshToken as string,
      refreshExp: data.refreshExp as number,
    }
  }

  static async forgotPassword(body: ForgotPasswordDto) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/forgot-password`, body)
    const { data, message } = response.data as BaseResponse<boolean>
    return { data, message }
  }

  static async resetPassword(body: ResetPasswordDto) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/reset-password`, body)
    const { data } = response.data as BaseResponse<boolean>
    return data
  }

  static async refreshToken(refreshToken: string) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/refresh-password`, { refreshToken })
    const { data } = response.data as BaseResponse<{ accessToken: string; accessExp: number }>
    return data
  }

  static async logout(refreshToken: string) {
    const response = await axios.post(`${CONFIG.API_URL}/auth/logout`, { refreshToken })
    const { data } = response.data as BaseResponse<boolean>
    return data
  }
}
