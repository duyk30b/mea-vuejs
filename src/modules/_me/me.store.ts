import { defineStore } from 'pinia'
import { LocalStorageService } from '../../core/local-storage.service'
import { Customer, useCustomerStore } from '../customer'
import { Distributor, useDistributorStore } from '../distributor'
import { Organization } from '../organization'
import type { Permission } from '../permission/permission.model'
import { User } from '../user/user.model'
import { useSettingStore } from './setting.store'

export const useMeStore = defineStore('me-store', {
  state: () => {
    // còn token nghĩa là còn user, cứ để đó check lại sau
    const user = LocalStorageService.getRefreshToken() ? User.blank() : null
    return {
      user,
      organization: Organization.blank(),
      distributorDefault: Distributor.blank(),
      customerDefault: Customer.blank(),
      permissionMap: <Record<string, Permission>>{},
      permissionIdMap: <Record<string, boolean>>{},
      rootSetting: {
        printDefault: {
          invoice: 0,
          laboratory: 0,
          optometry: 0,
          prescription: 0,
          radiology: 0,
        },
      },
    }
  },

  actions: {
    async getDistributorDefault() {
      const distributorIdDefault = useSettingStore().SCREEN_RECEIPT_UPSERT.distributor.idDefault
      if (distributorIdDefault) {
        if (!this.distributorDefault.id) {
          const data = await useDistributorStore().getOne(distributorIdDefault)
          if (data) {
            this.distributorDefault = data
          }
        }
      }
      return this.distributorDefault
    },

    async getCustomerDefault() {
      const customerIdDefault = useSettingStore().SCREEN_INVOICE_UPSERT.customer.idDefault
      if (customerIdDefault) {
        if (!this.customerDefault.id) {
          const data = await useCustomerStore().getOne(customerIdDefault)
          if (data) {
            this.customerDefault = data
          }
        }
      }
      return this.customerDefault
    },
  },
})
