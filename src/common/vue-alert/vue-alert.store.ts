import { randomId } from '@/utils'
import { reactive } from 'vue'

export interface IAlert {
	type: 'success' | 'warning' | 'error'
	message: string
	time: number
	progress: number
	interval?: ReturnType<typeof setInterval>,
	timeout?: ReturnType<typeof setTimeout>
}

const data = reactive<Record<string, IAlert>>({})

const add = (alert: { type: 'success' | 'warning' | 'error'; message: string; time?: number }) => {
	const key = randomId()
	data[key] = {
		type: alert.type,
		message: alert.message,
		time: alert.time || 3000,
		progress: 0,
	}

	data[key].interval = setInterval(() => {
		if (data[key]) {
			data[key].progress = (data[key].progress || 0) + 10
			if (data[key].progress > 100) clearInterval(data[key].interval)
		}
	}, data[key].time / 10)

	data[key].timeout = setTimeout(() => {
		delete data[key]
	}, data[key].time * 1.1)
}

const remove = (key: string) => {
	clearInterval(data[key].interval)
	clearTimeout(data[key].timeout)
	delete data[key]
}

export const AlertStore = { data, add, remove }
