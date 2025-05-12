import { defineStore } from 'pinia'
import { formatNumber } from '../../utils'
import { SETTING_DEFAULT } from './setting.default'

export const useSettingStore = defineStore('setting-store', {
  state: () => {
    return JSON.parse(JSON.stringify(SETTING_DEFAULT)) as typeof SETTING_DEFAULT
  },

  actions: {},

  getters: {
    formatMoney: (state) => {
      return (money?: number) => {
        if (!money) return '0'
        if (state.SYSTEM_SETTING.moneyDivisionFormat === 1) {
          return formatNumber({ number: money, fixed: 0 })
        }
        if (state.SYSTEM_SETTING.moneyDivisionFormat === 1000) {
          return formatNumber({
            number: money / state.SYSTEM_SETTING.moneyDivisionFormat,
            fixed: 3,
          })
        }
      }
    },
  },
})
