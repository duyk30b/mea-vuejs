import { ref } from 'vue'
import { DTimer } from '../../../utils'

const startDate = DTimer.startOfDate(new Date())

export const fromTime = ref<number>(startDate.getTime())
export const toTime = ref<number>()
