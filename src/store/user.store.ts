import { defineStore } from 'pinia'
import { USER } from '../core/local-storage.service'
import { Employee } from '../modules/employee'

export const useUserStore = defineStore('user-store', {
  state: () => {
    let userInfo: Employee | null = null
    try {
      const userString = localStorage.getItem(USER)
      if (userString) {
        const userPlain = JSON.parse(userString)
        userInfo = Employee.fromPlain(userPlain)
      }
    } catch (error) {
      console.log('🚀 ~ file: user.store.ts:15 ~ error:', error)
    }

    return { userInfo }
  },
})
