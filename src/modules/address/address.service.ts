import { AddressDB } from '@/core/indexed-db/repository/address.repository'
import { ESFunction, ESString } from '@/utils'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { MeService } from '../_me/me.service'
import { AuthService } from '../auth/auth.service'
import { AddressApi } from './address.api'
import { Address } from './address.model'
import { CONFIG } from '@/config'

export class AddressService {
  static loadedAll: boolean = false
  static addressAll: Address[] = []

  static async refreshDB() {
    try {
      let refreshTime = await RefreshTimeDB.findOneByCode('ADDRESS')
      if (!refreshTime) {
        refreshTime = { code: 'ADDRESS', dataVersion: 2, time: new Date(0).toISOString() }
      }
      const dataVersion = MeService.settingMapRoot.value.dataVersionParse?.address || 2

      if (refreshTime.dataVersion !== dataVersion) {
        await AddressDB.truncate()
        const addressAll = await AddressApi.all()
        await AddressDB.upsertMany(addressAll)

        refreshTime.dataVersion = dataVersion
        await RefreshTimeDB.upsertOne(refreshTime)
      }
    } catch (error: any) {
      console.log('🚀 ~ address.service.ts:29 ~ AddressService ~ refreshDB ~ error:', error)
      AlertStore.add({ type: 'error', message: error.message })
      if (CONFIG.MODE === 'production') {
        await AuthService.logout()
        location.reload()
      }
      return
    }
  }

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static fetchAll = (() => {
    const start = async () => {
      try {
        await AddressService.refreshDB()
        AddressService.addressAll = await AddressDB.findAll()
      } catch (error: any) {
        console.log('🚀 ~ file: commission.service.ts:20 ~ fetchAll ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !AddressService.loadedAll || options.refresh) {
        AddressService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  static async findBy(options: { province: string; ward: string }) {
    await AddressService.fetchAll()
    const addressFind = AddressService.addressAll.find((i) => {
      return i.province === options.province && i.ward === options.ward
    })
    return addressFind ? Address.from(addressFind) : Address.blank()
  }

  static search = ESFunction.debounceAsync(
    async (text: string, options: { limit: 20 }): Promise<Address[]> => {
      if (!text) text = ''
      const result = []
      for (let i = 0; i < AddressService.addressAll.length; i++) {
        if (result.length >= options.limit) {
          break
        }
        const address = AddressService.addressAll[i]
        if (ESString.customFilter(address.province, text, 1)) {
          result.push(address)
          continue
        }
        if (ESString.customFilter(address.ward, text, 1)) {
          result.push(address)
          continue
        }
        if (ESString.customFilter(`${address.ward} - ${address.province}`, text, 1)) {
          result.push(address)
          continue
        }
      }
      return result
    },
    100,
  )
}
