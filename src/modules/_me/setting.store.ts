import { defineStore } from 'pinia'
import { ESNumber } from '../../utils'
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
          return ESNumber.format({ number: money, round: 0 })
        }
        if (state.SYSTEM_SETTING.moneyDivisionFormat === 1000) {
          return ESNumber.format({
            number: money / state.SYSTEM_SETTING.moneyDivisionFormat,
            round: 3,
          })
        }
      }
    },
  },
})
