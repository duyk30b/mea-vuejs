import { defineStore } from 'pinia'
import { LocalStorageService } from '../../core/local-storage.service'
import { Customer } from '../customer'
import { Distributor } from '../distributor'
import { Organization } from '../organization'
import type { PermissionId } from '../permission/permission.enum'
import type { Permission } from '../permission/permission.model'
import { Role } from '../role'
import { User } from '../user/user.model'

export const useMeStore = defineStore('me-store', {
  state: () => {
    // còn token nghĩa là còn user, cứ để đó check lại sau
    const user = LocalStorageService.getRefreshToken() ? User.blank() : null
    return {
      user,
      organization: Organization.blank(),
      role: Role.blank(),
      distributorDefault: Distributor.blank(),
      customerDefault: Customer.blank(),
      permissionMap: <Record<string, Permission>>{},
      permissionIdMap: <Record<string, boolean>>{},
    }
  },

  actions: {
    checkPermission(permissionId: PermissionId) {
      // const permission = this.permissionMap[permissionId]
      // const pathIdArr = permission.pathId.split('.').map((i) => Number(i))
      // if (this.user?.oid === 0) return true
      // // Kiểm tra API có bị block
      // let publicCheck = false
      // for (let i = 0; i < pathIdArr.length; i++) {
      //   const id = pathIdArr[i]
      //   const curPermission = this.permissionMap[id]
      //   if (curPermission.status === PermissionStatus.PUBLIC) {
      //     publicCheck = true
      //   } else if (curPermission.status === PermissionStatus.BLOCK) {
      //     return false // chỉ cần 1 thằng block thì là false
      //   }
      // }
      // if (publicCheck) return true // nếu có public thì pass
    },
  },
})
