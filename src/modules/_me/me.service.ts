import { ref } from 'vue'
import { arrayToKeyValue, objectUpdatePropertyByObject } from '../../utils'
import {
  InventoryStrategy,
  SplitBatchByCostPrice,
  SplitBatchByDistributor,
  SplitBatchByExpiryDate,
  SplitBatchByWarehouse,
} from '../enum'
import type { Organization } from '../organization'
import type { Permission } from '../permission/permission.model'
import { SettingApi } from '../setting/setting.api'
import type { User } from '../user'
import { MeApi } from './me.api'
import { useMeStore } from './me.store'
import { SETTING_DEFAULT } from './setting.default'
import { useSettingStore } from './setting.store'
import { SettingKey } from './store.variable'
import type { Product } from '../product'
import { PrintHtml, PrintHtmlService } from '../print-html'

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

  static getProductSetting(product: Product) {
    const splitRule: typeof MeService.settingMap.value.PRODUCT_SETTING = {
      allowNegativeQuantity: false,
      inventoryStrategy: product.inventoryStrategy,
      splitBatchByWarehouse: product.splitBatchByWarehouse,
      splitBatchByDistributor: product.splitBatchByDistributor,
      splitBatchByExpiryDate: product.splitBatchByExpiryDate,
      splitBatchByCostPrice: product.splitBatchByCostPrice,
    }

    const productSettingCommon = MeService.getProductSettingCommon()

    splitRule.allowNegativeQuantity = productSettingCommon.allowNegativeQuantity

    if (splitRule.inventoryStrategy === InventoryStrategy.Inherit) {
      splitRule.inventoryStrategy = productSettingCommon.inventoryStrategy
    }

    if (splitRule.splitBatchByWarehouse === SplitBatchByWarehouse.Inherit) {
      splitRule.splitBatchByWarehouse = productSettingCommon.splitBatchByWarehouse
    }

    if (splitRule.splitBatchByDistributor === SplitBatchByDistributor.Inherit) {
      splitRule.splitBatchByDistributor = productSettingCommon.splitBatchByDistributor
    }

    if (splitRule.splitBatchByExpiryDate === SplitBatchByExpiryDate.Inherit) {
      splitRule.splitBatchByExpiryDate = productSettingCommon.splitBatchByExpiryDate
    }

    if (splitRule.splitBatchByCostPrice === SplitBatchByCostPrice.Inherit) {
      splitRule.splitBatchByCostPrice = productSettingCommon.splitBatchByCostPrice
    }
    return splitRule
  }

  static getProductSettingCommon() {
    const splitRule = { ...MeService.settingMap.value.PRODUCT_SETTING }

    const productSettingRoot = MeService.settingMapRoot.value.PRODUCT_SETTING

    if (splitRule.inventoryStrategy === InventoryStrategy.Inherit) {
      splitRule.inventoryStrategy = productSettingRoot.inventoryStrategy
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

  static getPrintSetting() {
    const printSettingCommon = {
      ...MeService.settingMap.value.PRINT_SETTING,
    }
    const printSettingRoot = MeService.settingMapRoot.value.PRINT_SETTING
    if (printSettingCommon._LAYOUT_HEADER.printHtmlId === 0) {
      printSettingCommon._LAYOUT_HEADER.printHtmlId = printSettingRoot._LAYOUT_HEADER.printHtmlId
    }
    if (printSettingCommon.invoice.printHtmlId === 0) {
      printSettingCommon.invoice.printHtmlId = printSettingRoot.invoice.printHtmlId
    }
    if (printSettingCommon.prescription.printHtmlId === 0) {
      printSettingCommon.prescription.printHtmlId = printSettingRoot.prescription.printHtmlId
    }
    if (printSettingCommon.optometry.printHtmlId === 0) {
      printSettingCommon.optometry.printHtmlId = printSettingRoot.optometry.printHtmlId
    }
    if (printSettingCommon.laboratory.printHtmlId === 0) {
      printSettingCommon.laboratory.printHtmlId = printSettingRoot.laboratory.printHtmlId
    }
    if (printSettingCommon.radiology.printHtmlId === 0) {
      printSettingCommon.radiology.printHtmlId = printSettingRoot.radiology.printHtmlId
    }
    return printSettingCommon
  }


}
