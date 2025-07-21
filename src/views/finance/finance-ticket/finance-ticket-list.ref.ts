import { ESTimer } from '@/utils'
import { ref } from 'vue'

const startDate = ESTimer.startOfDate(new Date())

export const fromTime = ref<number>(startDate.getTime())
export const toTime = ref<number>()
