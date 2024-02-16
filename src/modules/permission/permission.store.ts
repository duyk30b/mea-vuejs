import { defineStore } from 'pinia'
import { arrayToKeyValue } from '../../utils'
import { PermissionApi } from './permission.api'
import type { Permission } from './permission.model'

export type PermissionTree = Permission & {
  key: number
  title: string
  children: PermissionTree[]
}

export const usePermissionStore = defineStore('permission-store', {
  state: () => {
    return {
      loaded: false,
      permissionList: [] as Permission[],
    }
  },

  actions: {
    async fetchAll() {
      if (!this.loaded) {
        this.permissionList = await PermissionApi.list({ sort: { id: 'ASC' } })
        this.loaded = true
      }
    },
  },

  getters: {
    permissionGroup: (state) => {
      return () => {
        const permissionList: PermissionTree[] = state.permissionList.map((item) => {
          return {
            ...item,
            title: item.name,
            key: item.id,
            children: [],
          }
        })
        const permissionMap = arrayToKeyValue(permissionList, 'id')
        permissionList.forEach((i) => {
          if (i.level === 1) return
          permissionMap[i.parentId].children.push(i)
        })

        return permissionList.filter((i) => i.level === 1)
      }
    },
  },
})
