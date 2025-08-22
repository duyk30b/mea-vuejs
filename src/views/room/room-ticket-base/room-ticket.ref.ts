import { ref } from 'vue'
import { ESTimer } from '@/utils'

const startDate = ESTimer.startOfDate(new Date())

export const fromTime = ref<number>(startDate.getTime())
export const toTime = ref<number>()
