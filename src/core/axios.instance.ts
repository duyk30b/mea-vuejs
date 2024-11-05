import axios, { type AxiosRequestConfig } from 'axios'
import { reactive } from 'vue'
import { AlertStore } from '../common/vue-alert/vue-alert.store'
import { CONFIG } from '../config'
import { DeviceInstance } from './device.instance'
import { LocalStorageService } from './local-storage.service'
import { AuthService } from '../modules/auth/auth.service'

axios.defaults.headers.post['x-os'] = DeviceInstance.platform
axios.defaults.headers.post['x-browser'] = DeviceInstance.browser
axios.defaults.headers.post['x-mobile'] = DeviceInstance.mobile
axios.defaults.headers.post['x-client-id'] = CONFIG.CLIENT_ID

const AxiosLoading = reactive({ percent: 0, loading: true })

const AxiosInstance = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 10 * 1000,
  headers: {
    'Content-Type': 'application/json',
  },
})

AxiosInstance.interceptors.request.use(
  async (config) => {
    const controller = new AbortController()
    config.signal = controller.signal

    // nếu refreshToken sắp hết hạn thì logout (cho hết hạn trước 60s)
    if (
      !LocalStorageService.getRefreshToken() ||
      LocalStorageService.getRefreshExp() - 60 * 1000 < Date.now()
    ) {
      await AuthService.logout()
      controller.abort()
      return config
    }
    // nếu accessToken sắp hết hạn (cho hết hạn trước 10s)
    if (LocalStorageService.getAccessExp() - 10 * 1000 < Date.now()) {
      await AuthService.refreshToken()
    }
    if (!LocalStorageService.getAccessToken()) {
      controller.abort()
      return config
    }

    config.headers!['Authorization'] = `Bearer ${LocalStorageService.getAccessToken()}`

    AxiosLoading.percent = 40
    AxiosLoading.loading = true
    return config
  },
  (error) => Promise.reject(error)
)

AxiosInstance.interceptors.response.use(
  (response) => {
    AxiosLoading.percent = 100
    setTimeout(() => (AxiosLoading.loading = false), 300)
    return response
  },
  async (error: any) => {
    if (error?.response?.status === 401) {
      const originalRequest: AxiosRequestConfig = error.config
      await AuthService.refreshToken()
      if (!LocalStorageService.getAccessToken()) {
        return Promise.reject()
      }
      originalRequest!.headers!['Authorization'] = `Bearer ${LocalStorageService.getAccessToken()}`
      return AxiosInstance(originalRequest)
    }
    if (error?.response?.status === 403) {
      await AuthService.logout()
    }
    const message = error?.response?.data?.message || error.message || error?.config.signal?.reason
    if (message !== 'canceled') {
      AlertStore.add({ type: 'error', message, time: 5000 })
      AxiosLoading.percent = 0
      AxiosLoading.loading = false
    }

    return Promise.reject(error)
  }
)

export { AxiosInstance, AxiosLoading }
