import { useMeStore } from '../_me/me.store'
import type { SettingKey } from '../_me/store.variable'
import { SettingApi } from '../setting/setting.api'
import { OrganizationApi } from './organization.api'
import { Organization } from './organization.model'

export class OrganizationService {
  static async info() {
    try {
      const organization = await OrganizationApi.info()
      useMeStore().organization = Organization.toBasic(organization)
      return organization
    } catch (error) {
      console.log('🚀 ~ OrganizationService ~ info ~ error:', error)
      return Organization.blank()
    }
  }

  static async updateInfo(plain: Partial<Organization>) {
    const organization = await OrganizationApi.updateInfo(plain)
    useMeStore().organization = Organization.toBasic(organization)
    return organization
  }

  static async saveSettings(type: SettingKey, plain: string) {
    return await SettingApi.saveSettings(type, plain)
  }
}
