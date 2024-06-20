import { useMeStore } from '../_me/me.store'
import type { ScreenSettingKey } from '../_me/store.variable'
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

  static async saveSettings(type: ScreenSettingKey, plain: string) {
    return await OrganizationApi.saveSettings(type, plain)
  }
}
