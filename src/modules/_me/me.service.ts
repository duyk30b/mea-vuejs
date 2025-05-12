import { ref } from 'vue'
import { arrayToKeyValue, objectUpdatePropertyByObject } from '../../utils'
import type { Organization } from '../organization'
import type { Permission } from '../permission/permission.model'
import { SettingApi } from '../setting/setting.api'
import type { User } from '../user'
import { MeApi } from './me.api'
import { useMeStore } from './me.store'
import {
  BatchCostPriceRule,
  BatchDistributorIdRule,
  BatchWarehouseIdRule,
  SETTING_DEFAULT,
} from './setting.default'
import { useSettingStore } from './setting.store'
import { SettingKey } from './store.variable'

export class MeService {
  static settingMapRoot = ref<typeof SETTING_DEFAULT>({} as any)
  static settingMap = ref<typeof SETTING_DEFAULT>({} as any)

  static reCalculatorSetting(settingStore: any, settingMap: Record<string, any>) {
    Object.keys(SETTING_DEFAULT).forEach((key) => {
      settingStore[key as keyof typeof SettingKey] = JSON.parse(
        JSON.stringify(SETTING_DEFAULT[key as keyof typeof SettingKey]),
      )
      if (settingMap[key] == null) return
      if (
        [
          SettingKey.GOOGLE_DRIVER,
          SettingKey.PRODUCT_UNIT,
          SettingKey.PRODUCT_ROUTE,
          SettingKey.PRODUCT_HINT_USAGE,
          SettingKey.INVOICE_SURCHARGE_DETAIL,
          SettingKey.INVOICE_EXPENSE_DETAIL,
        ].includes(key as any)
      ) {
        settingStore[key as keyof typeof SettingKey] = settingMap[key]
      } else {
        settingStore[key as keyof typeof SettingKey] = objectUpdatePropertyByObject(
          settingStore[key as keyof typeof SettingKey] as any,
          settingMap[key],
        )
      }
    })
  }

  static reCalculatorPermission(options: {
    permissionAll: Permission[]
    permissionIds: number[]
    user: User
    organization: Organization
  }) {
    const { permissionAll, permissionIds, user, organization } = options
    const meStore = useMeStore()
    meStore.user = user
    meStore.organization = organization

    const organizationPermissionIds: number[] = JSON.parse(organization.permissionIds)

    const permissionMap = arrayToKeyValue(permissionAll, 'id')
    meStore.permissionMap = permissionMap

    const permissionIdMap: Record<string, boolean> = {}
    permissionAll.forEach((permission) => {
      // ROOT thì auto pass dù API inActive
      // if (user.oid === 1) {
      //   return (permissionIdMap[permission.id] = true)
      // }

      const pathIdArr = permission.pathId.split('.').map((i) => Number(i))
      // Kiểm tra API có bị inActive
      for (let i = 0; i < pathIdArr.length; i++) {
        const id = pathIdArr[i]
        const curPermission = permissionMap[id]
        if (!curPermission.isActive) {
          return // chỉ cần 1 thằng inActive thì là false
        }
      }
      // org không có quyền thì nghỉ
      if (!organizationPermissionIds.includes(permission.rootId)) {
        return
      }

      if (pathIdArr.some((pid) => permissionIds.includes(pid))) {
        permissionIdMap[permission.id] = true
      }
    })
    meStore.permissionIdMap = permissionIdMap
  }

  static async initData() {
    try {
      const {
        organization,
        permissionAll,
        permissionIds,
        settingMap,
        settingMapRoot,
        user,
        rootSetting,
      } = await MeApi.info()

      const settingStore = useSettingStore()
      MeService.reCalculatorSetting(settingStore, settingMap)
      MeService.reCalculatorSetting(MeService.settingMap.value, settingMap)
      MeService.reCalculatorSetting(MeService.settingMapRoot.value, settingMapRoot)
      MeService.reCalculatorPermission({ permissionAll, permissionIds, user, organization })

      const meStore = useMeStore()
      meStore.rootSetting = objectUpdatePropertyByObject(meStore.rootSetting, rootSetting)
    } catch (error) {
      console.log('🚀 ~ file: organization.store.ts:96 ~ init ~ error:', error)
    }
  }

  static async reloadSetting() {
    const { settingMap } = await SettingApi.getMap()
    const settingStore = useSettingStore()
    this.reCalculatorSetting(settingStore, settingMap)
    MeService.reCalculatorSetting(MeService.settingMap.value, settingMap)
  }

  static getBatchSetting() {
    const batchSettingCommon = {
      ...MeService.settingMap.value.BATCH_SETTING,
    }
    const batchSettingRoot = MeService.settingMapRoot.value.BATCH_SETTING
    if (batchSettingCommon.warehouseId === BatchWarehouseIdRule.Inherit) {
      batchSettingCommon.warehouseId = batchSettingRoot.warehouseId
    }
    if (batchSettingCommon.distributorId === BatchDistributorIdRule.Inherit) {
      batchSettingCommon.distributorId = batchSettingRoot.distributorId
    }
    if (batchSettingCommon.costPrice === BatchCostPriceRule.Inherit) {
      batchSettingCommon.costPrice = batchSettingRoot.costPrice
    }
    return batchSettingCommon
  }
}
