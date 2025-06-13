import { ESArray } from '../../utils'
import { MeService } from '../_me/me.service'
import { PermissionApi } from './permission.api'
import { Permission } from './permission.model'

export class PermissionService {
  static loadedAll: boolean = false
  static permissionAll: Permission[] = []

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const data = await PermissionApi.list({ sort: { id: 'ASC' } })
        PermissionService.permissionAll = data
      } catch (error: any) {
        console.log('🚀 ~ permission.service.ts:22 ~ PermissionService ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetchPromise || !PermissionService.loadedAll || options.refresh) {
        PermissionService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  static async getPermissionTree() {
    await PermissionService.fetchAll()
    const permissionAllClone = Permission.fromList(PermissionService.permissionAll)
    const permissionMap = ESArray.arrayToKeyValue(permissionAllClone, 'id')
    permissionAllClone.forEach((i) => {
      if (i.level === 1) return
      if (!permissionMap[i.parentId].children) {
        permissionMap[i.parentId].children = []
      }
      permissionMap[i.parentId].children.push(i)
    })

    return permissionAllClone.filter((i) => {
      return i.level === 1 && MeService.organizationPermission.value[i.id]
    })
  }
}
