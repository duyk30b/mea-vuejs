import type { User } from '../modules/user'

export const ACCESS_TOKEN = 'access_token'
export const ACCESS_EXP = 'access_exp'
export const REFRESH_TOKEN = 'refresh_token'
export const REFRESH_EXP = 'refresh_exp'
export const ORG_PHONE = 'org_phone'

export class LocalStorageService {
  static setToken(data: {
    accessToken: string
    accessExp: number
    refreshToken: string
    refreshExp: number
  }) {
    const { accessToken, refreshToken, accessExp, refreshExp } = data
    localStorage.setItem(ACCESS_TOKEN, accessToken)
    localStorage.setItem(ACCESS_EXP, accessExp.toString())
    localStorage.setItem(REFRESH_TOKEN, refreshToken)
    localStorage.setItem(REFRESH_EXP, refreshExp.toString())
  }

  static removeToken() {
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(ACCESS_EXP)
    localStorage.removeItem(REFRESH_TOKEN)
    localStorage.removeItem(REFRESH_EXP)
  }

  static setAccessToken(data: { accessToken: string; accessExp: number }) {
    localStorage.setItem(ACCESS_TOKEN, data.accessToken)
    localStorage.setItem(ACCESS_EXP, data.accessExp.toString())
  }

  static getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN)
  }

  static getAccessExp() {
    return Number(localStorage.getItem(ACCESS_EXP))
  }

  static getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN)
  }

  static getRefreshExp() {
    return Number(localStorage.getItem(REFRESH_EXP))
  }

  static setOrgPhone(phone: string) {
    localStorage.setItem(ORG_PHONE, phone)
  }

  static getOrgPhone() {
    return localStorage.getItem(ORG_PHONE) || ''
  }
}
