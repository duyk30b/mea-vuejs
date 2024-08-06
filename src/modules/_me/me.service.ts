import { arrayToKeyValue, objectUpdatePropertyByObject } from '../../utils'
import type { Organization } from '../organization'
import type { Permission } from '../permission/permission.model'
import type { Role } from '../role'
import { SettingApi } from '../setting/setting.api'
import type { User } from '../user'
import { MeApi } from './me.api'
import { useMeStore } from './me.store'
import { settingDefault, useSettingStore } from './setting.store'
import { SettingKey } from './store.variable'

export class MeService {
  static reCalculatorSetting(settingMap: Record<string, any>) {
    const settingStore = useSettingStore()
    Object.keys(settingDefault).forEach((key) => {
      settingStore[key as keyof typeof SettingKey] = JSON.parse(
        JSON.stringify(settingDefault[key as keyof typeof SettingKey])
      )
      if (settingMap[key] == null) return
      if (
        [
          SettingKey.GOOGLE_DRIVER,
          SettingKey.PRODUCT_GROUP,
          SettingKey.PRODUCT_UNIT,
          SettingKey.PRODUCT_ROUTE,
          SettingKey.PRODUCT_HINT_USAGE,
          SettingKey.PROCEDURE_GROUP,
          SettingKey.INVOICE_SURCHARGE_DETAIL,
          SettingKey.INVOICE_EXPENSE_DETAIL,
        ].includes(key as any)
      ) {
        settingStore[key as keyof typeof SettingKey] = settingMap[key]
      } else {
        settingStore[key as keyof typeof SettingKey] = objectUpdatePropertyByObject(
          settingStore[key as keyof typeof SettingKey] as any,
          settingMap[key]
        )
      }
    })
  }

  static reCalculatorPermission(options: {
    permissionList: Permission[]
    user: User
    role: Role
    organization: Organization
  }) {
    const { permissionList, user, role, organization } = options
    const meStore = useMeStore()
    meStore.user = user
    meStore.role = role
    meStore.organization = organization

    const organizationPermissionIds: number[] = JSON.parse(organization.permissionIds)
    const rolePermissionIds: number[] = JSON.parse(role.permissionIds)

    const permissionMap = arrayToKeyValue(permissionList, 'id')
    meStore.permissionMap = permissionMap

    const permissionIdMap: Record<string, boolean> = {}
    permissionList.forEach((permission) => {
      // ROOT thì auto pass dù API inActive
      if (user.oid === 0) {
        return (permissionIdMap[permission.id] = true)
      }

      const pathIdArr = permission.pathId.split('.').map((i) => Number(i))
      // Kiểm tra API có bị inActive
      for (let i = 0; i < pathIdArr.length; i++) {
        const id = pathIdArr[i]
        const curPermission = permissionMap[id]
        if (!curPermission.isActive) {
          return false // chỉ cần 1 thằng inActive thì là false
        }
      }
      // org không có quyền thì nghỉ
      if (!organizationPermissionIds.includes(permission.rootId)) {
        return
      }

      // Admin thì auto pass sau khi filter Org
      if (user.roleId === 1) {
        return (permissionIdMap[permission.id] = true)
      }

      if (pathIdArr.some((pid) => rolePermissionIds.includes(pid))) {
        permissionIdMap[permission.id] = true
      }
    })
    meStore.permissionIdMap = permissionIdMap
  }

  static async initData() {
    try {
      const { user, organization, role, permissionList, settingMap } = await MeApi.info()

      MeService.reCalculatorSetting(settingMap)
      MeService.reCalculatorPermission({ permissionList, user, role, organization })
    } catch (error) {
      console.log('🚀 ~ file: organization.store.ts:96 ~ init ~ error:', error)
    }
  }

  static async reloadSetting() {
    const { settingMap } = await SettingApi.getMap()
    this.reCalculatorSetting(settingMap)
  }
}
