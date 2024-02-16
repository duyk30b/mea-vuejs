import axios from 'axios'
import { reactive } from 'vue'
import { AlertStore } from '../common/vue-alert/vue-alert.store'
import { CONFIG } from '../config'
import { DeviceInstance } from './device.instance'
import { LocalStorageService } from './local-storage.service'
import { AuthService } from '../modules/auth/auth.service'

axios.defaults.headers.post['x-os'] = DeviceInstance.platform
axios.defaults.headers.post['x-browser'] = DeviceInstance.browser
axios.defaults.headers.post['x-mobile'] = DeviceInstance.mobile

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
      controller.abort('Phiên đăng nhập đã hết hạn')
      return config
    }
    // nếu accessToken sắp hết hạn (cho hết hạn trước 10s)
    if (LocalStorageService.getAccessExp() - 10 * 1000 < Date.now()) {
      await AuthService.getAccessToken()
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
    if ([401].includes(error?.response?.status)) {
      await AuthService.logout() // TODO nếu 401 thì refreshToken
    }
    if ([403].includes(error?.response?.status)) {
      await AuthService.logout()
    }
    const message = error?.response?.data?.message || error.message || error?.config.signal?.reason
    AlertStore.add({ type: 'error', message, time: 5000 })
    AxiosLoading.percent = 0
    AxiosLoading.loading = false

    return Promise.reject(error)
  }
)

export { AxiosInstance, AxiosLoading }
