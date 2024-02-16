import { arrayToKeyValue, objectUpdatePropertyByObject } from '../../utils'
import { MeApi } from './me.api'
import { useMeStore } from './me.store'
import { useScreenStore } from './screen.store'
import { ScreenSettingKey } from './store.variable'

export class MeService {
  static async initData() {
    const meStore = useMeStore()
    const screenStore = useScreenStore()
    try {
      const {
        user,
        role,
        permissions,
        screenSettings,
        organization,
        distributorDefault,
        customerDefault,
      } = await MeApi.info()

      meStore.user = user
      meStore.role = role
      meStore.organization = organization
      meStore.distributorDefault = distributorDefault
      meStore.customerDefault = customerDefault

      Object.keys(screenSettings || {}).forEach((key) => {
        if (
          [
            ScreenSettingKey.PRODUCT_GROUP,
            ScreenSettingKey.PROCEDURE_GROUP,
            ScreenSettingKey.INVOICE_SURCHARGE_DETAIL,
            ScreenSettingKey.INVOICE_EXPENSE_DETAIL,
          ].includes(key as any)
        ) {
          screenStore[key as keyof typeof ScreenSettingKey] = JSON.parse(screenSettings[key])
        } else {
          screenStore[key as keyof typeof ScreenSettingKey] = objectUpdatePropertyByObject(
            screenStore[key as keyof typeof ScreenSettingKey] as any,
            JSON.parse(screenSettings[key])
          )
        }
      })

      // =========== Tính lại Permission =========== //
      const organizationPermissionIds: number[] = JSON.parse(organization.permissionIds)
      const rolePermissionIds: number[] = JSON.parse(role.permissionIds)
      const permissionMap = arrayToKeyValue(permissions, 'id')
      meStore.permissionMap = permissionMap

      const permissionIdMap: Record<string, boolean> = {}
      permissions.forEach((permission) => {
        const pathIdArr = permission.pathId.split('.').map((i) => Number(i))
        // ROOT thì auto pass dù API inActive
        if (user.oid === 0) {
          return (permissionIdMap[permission.id] = true)
        }

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
    } catch (error) {
      console.log('🚀 ~ file: organization.store.ts:19 ~ init ~ error:', error)
    }
  }
}
