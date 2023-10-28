import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme-store', {
  state: () => {
    return { title: '' as string }
  },

  actions: {
    async setTitle(data: string) {
      this.title = data
    },
  },

  getters: {},
})
