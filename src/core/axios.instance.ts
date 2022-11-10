import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { CONFIG } from '@/config'
import { useUserStore } from '@/store/user.store'
import axios from 'axios'
import { reactive } from 'vue'
import { ACCESS_EXP, ACCESS_TOKEN, LocalStorageService, REFRESH_EXP, REFRESH_TOKEN } from './local-storage.service'

const getAccessToken = (() => {
	const start = async () => {
		try {
			const url = `${CONFIG.API_URL}/auth/refresh-token`
			const refresh_token = localStorage.getItem('refresh_token')
			if (!refresh_token) throw new Error()
			const { data } = await axios.post(url, { refresh_token })
			LocalStorageService.setAccessToken(data)
		} catch (error: any) {
			console.log('🚀 ~ file: axios.instance.ts:17 ~ getAccessToken 1n ~ error:', error)
			if (error?.response?.data?.message === 'read ECONNRESET') { // Phía backend lỗi kết nối db sau 1 thời gian
				try {
					const url = `${CONFIG.API_URL}/auth/refresh-token`
					const refresh_token = localStorage.getItem('refresh_token')
					if (!refresh_token) throw new Error()
					const { data } = await axios.post(url, { refresh_token })
					LocalStorageService.setAccessToken(data)
				} catch {
					console.log('🚀 ~ file: axios.instance.ts:26 ~ getAccessToke 2n ~ error:', error)
					LocalStorageService.removeAuth()
					useUserStore().userInfo = null
				}
			} else {
				LocalStorageService.removeAuth()
				useUserStore().userInfo = null
			}
		}
	}
	let fetching: any = null
	return async () => {
		if (!fetching) fetching = start()
		await fetching
		fetching = null
	}
})()

const AxiosLoading = reactive({ percent: 0, loading: true })

const AxiosInstance = axios.create({
	baseURL: CONFIG.API_URL,
	timeout: 10 * 1000,
	headers: { 'Content-Type': 'application/json' },
})

AxiosInstance.interceptors.request.use(
	async (config) => {
		const controller = new AbortController()
		config.signal = controller.signal

		// nếu refreshToken sắp hết hạn thì logout (cho hết hạn trước 60s)
		if (!localStorage.getItem(REFRESH_TOKEN) || Number(localStorage.getItem(REFRESH_EXP)) - 60 * 1000 < Date.now()) {
			LocalStorageService.removeAuth()
			useUserStore().userInfo = null
			controller.abort('Phiên đăng nhập đã hết hạn')
			return config
		}
		// nếu accessToken sắp hết hạn (cho hết hạn trước 10s)
		if (Number(localStorage.getItem(ACCESS_EXP)) - 10 * 1000 < Date.now()) {
			await getAccessToken()
		}
		if (!localStorage.getItem(ACCESS_TOKEN)) {
			controller.abort()
			return config
		}

		config.headers!['Authorization'] = `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`

		AxiosLoading.percent = 40
		AxiosLoading.loading = true
		return config
	},
	(error) => Promise.reject(error)
)

AxiosInstance.interceptors.response.use(
	(response) => {
		AxiosLoading.percent = 100
		setTimeout(() => { AxiosLoading.loading = false }, 300)
		return response
	},
	(error: any) => {
		let message = error?.config.signal?.reason || error?.response?.data?.message || error.message
		if (message === 'Validate.Failed') {
			const property = error?.response?.data?.errors?.[0]?.property
			if (property === 'phone') {
				message = 'Định dạng số điện thoại không đúng'
			}
		}

		AlertStore.add({ type: 'error', message })
		AxiosLoading.percent = 0
		AxiosLoading.loading = false

		return Promise.reject(error)
	}
)

export { AxiosInstance, AxiosLoading }
