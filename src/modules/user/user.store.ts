import { defineStore } from 'pinia'
import { LocalStorageService } from '../../core/local-storage.service'
import type { User } from './user.model'

export const useUserStore = defineStore('user-store', {
  state: () => {
    const userInfo: User | null = LocalStorageService.getUser()

    return { userInfo }
  },

  actions: {
    async removeAuth() {
      LocalStorageService.removeAuth()
      this.userInfo = null
    },
  },
})
