import { defineStore } from 'pinia'
import { LocalStorageService } from '../../core/local-storage.service'
import { Organization } from '../organization'
import type { Permission } from '../permission/permission.model'
import { User } from '../user/user.model'

export const useMeStore = defineStore('me-store', {
  state: () => {
    // còn token nghĩa là còn user, cứ để đó check lại sau
    const user = LocalStorageService.getRefreshToken() ? User.blank() : null
    return {
      user,
      organization: Organization.blank(),
      permissionMap: <Record<string, Permission>>{},
      permissionIdMap: <Record<string, boolean>>{},
    }
  },
})
