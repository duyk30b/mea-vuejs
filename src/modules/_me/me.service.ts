import { ref } from 'vue'
import { LocalStorageService } from '../../core/local-storage.service'
import { arrayToKeyValue, objectUpdatePropertyByObject } from '../../utils'
import {
  PickupStrategy,
  SplitBatchByCostPrice,
  SplitBatchByDistributor,
  SplitBatchByExpiryDate,
  SplitBatchByWarehouse,
} from '../enum'
import { Organization } from '../organization'
import type { Permission } from '../permission/permission.model'
import { SettingApi } from '../setting/setting.api'
import { User } from '../user'
import { MeApi } from './me.api'
import { SETTING_DEFAULT } from './setting.default'
import { useSettingStore } from './setting.store'
import { SettingKey } from './store.variable'

export class MeService {
  static user = ref(LocalStorageService.getRefreshToken() ? User.blank() : null)
  static organization = ref(Organization.blank())

  static settingMapRoot = ref<typeof SETTING_DEFAULT>({} as any)
  static settingMap = ref<typeof SETTING_DEFAULT>({} as any)

  static permissionMap = ref<Record<string, Permission>>({})
  static userPermission = ref<Record<string, boolean>>({})
  static organizationPermission = ref<Record<string, boolean>>({})

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
    MeService.user.value = user
    MeService.organization.value = organization

    const permissionMap = arrayToKeyValue(permissionAll, 'id')
    MeService.permissionMap.value = permissionMap

    const organizationPermission: Record<string, boolean> = {}
    const userPermission: Record<string, boolean> = {}

    const organizationPermissionIds: number[] = JSON.parse(organization.permissionIds)
    organizationPermissionIds.forEach((i) => {
      organizationPermission[i] = true
    })
    MeService.organizationPermission.value = organizationPermission

    permissionAll.forEach((permission) => {
      // ROOT thì auto pass dù API inActive
      if (user.oid === 1) {
        userPermission[permission.id] = true
        return
      }

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
        userPermission[permission.id] = true
      }
    })
    MeService.userPermission.value = userPermission
  }

  static async initData() {
    try {
      const { organization, permissionAll, permissionIds, settingMap, settingMapRoot, user } =
        await MeApi.info()

      const settingStore = useSettingStore()
      MeService.reCalculatorSetting(settingStore, settingMap)
      MeService.reCalculatorSetting(MeService.settingMap.value, settingMap)
      MeService.reCalculatorSetting(MeService.settingMapRoot.value, settingMapRoot)
      MeService.reCalculatorPermission({ permissionAll, permissionIds, user, organization })
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

  static getProductSettingCommon() {
    const splitRule = { ...MeService.settingMap.value.PRODUCT_SETTING }

    const productSettingRoot = MeService.settingMapRoot.value.PRODUCT_SETTING

    if (splitRule.pickupStrategy === PickupStrategy.Inherit) {
      splitRule.pickupStrategy = productSettingRoot.pickupStrategy
    }

    if (splitRule.splitBatchByWarehouse === SplitBatchByWarehouse.Inherit) {
      splitRule.splitBatchByWarehouse = productSettingRoot.splitBatchByWarehouse
    }

    if (splitRule.splitBatchByDistributor === SplitBatchByDistributor.Inherit) {
      splitRule.splitBatchByDistributor = productSettingRoot.splitBatchByDistributor
    }

    if (splitRule.splitBatchByExpiryDate === SplitBatchByExpiryDate.Inherit) {
      splitRule.splitBatchByExpiryDate = productSettingRoot.splitBatchByExpiryDate
    }

    if (splitRule.splitBatchByCostPrice === SplitBatchByCostPrice.Inherit) {
      splitRule.splitBatchByCostPrice = productSettingRoot.splitBatchByCostPrice
    }
    return splitRule
  }
}
