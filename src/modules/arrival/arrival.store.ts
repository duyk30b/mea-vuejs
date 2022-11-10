import { defineStore } from 'pinia'
import type { Arrival } from './arrival.model'

export const useArrivalStore = defineStore('arrival-store', {
    state: () => ({ data: {} as Record<number, Arrival> }),
    actions: {},
})
