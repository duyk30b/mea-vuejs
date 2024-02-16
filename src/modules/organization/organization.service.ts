import { useMeStore } from '../_me/me.store'
import type { ScreenSettingKey } from '../_me/store.variable'
import { OrganizationApi } from './organization.api'
import { Organization } from './organization.model'

export class OrganizationService {
  static async info() {
    try {
      const organization = await OrganizationApi.info()
      useMeStore().organization = Organization.fromInstance(organization)
      return organization
    } catch (error) {
      console.log('🚀 ~ OrganizationService ~ info ~ error:', error)
      return Organization.blank()
    }
  }

  static async updateInfo(plain: Partial<Organization>) {
    try {
      const organization = await OrganizationApi.updateInfo(plain)
      useMeStore().organization = Organization.fromInstance(organization)
      return organization
    } catch (error) {
      console.log('🚀 ~ OrganizationService ~ updateInfo ~ error:', error)
    }
  }

  static async saveSettings(type: ScreenSettingKey, plain: string) {
    return await OrganizationApi.saveSettings(type, plain)
  }
}
