import { ICDDB } from '@/core/indexed-db'
import { ESFunction, ESString } from '@/utils'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { RefreshTimeDB } from '../../core/indexed-db'
import { MeService } from '../_me/me.service'
import { AuthService } from '../auth/auth.service'
import { ICDApi } from './icd.api'
import { ICD } from './icd.model'
import { CONFIG } from '@/config'

export class ICDService {
  static loadedAll: boolean = false
  static icdAll: ICD[] = []

  static async refreshDB() {
    try {
      let refreshTime = await RefreshTimeDB.findOneBy({ code: 'ICD' })
      if (!refreshTime) {
        refreshTime = { code: 'ICD', dataVersion: 2, time: new Date(0).toISOString() }
      }
      const dataVersion = MeService.settingMapRoot.value.dataVersionParse?.icd || 2

      if (refreshTime.dataVersion !== dataVersion) {
        await ICDDB.truncate()
        const icdAll = await ICDApi.all()
        await ICDDB.upsertMany(icdAll)

        refreshTime.dataVersion = dataVersion
        await RefreshTimeDB.upsertOne(refreshTime)
      }
    } catch (error: any) {
      console.log('🚀 ~ icd.service.ts:29 ~ ICDService ~ refreshDB ~ error:', error)
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
        await ICDService.refreshDB()
        ICDService.icdAll = await ICDDB.findManyBy({})
      } catch (error: any) {
        console.log('🚀 ~ file: commission.service.ts:20 ~ fetchAll ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !ICDService.loadedAll || options.refresh) {
        ICDService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  static search = ESFunction.debounceAsync(
    async (text: string, options: { limit: 20 }): Promise<ICD[]> => {
      await ICDService.fetchAll()
      if (!text) text = ''
      const result = []
      for (let i = 0; i < ICDService.icdAll.length; i++) {
        if (result.length >= options.limit) {
          break
        }
        const icd = ICDService.icdAll[i]
        if (ESString.customFilter(icd.code, text, 0)) {
          result.push(icd)
          continue
        }
        if (ESString.customFilter(icd.name, text, 0)) {
          result.push(icd)
          continue
        }
      }
      return result
    },
    100,
  )
}
