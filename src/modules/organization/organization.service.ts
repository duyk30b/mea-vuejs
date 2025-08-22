import { MeService } from '../_me/me.service'
import type { SettingKey } from '../_me/store.variable'
import { SettingApi } from '../setting/setting.api'
import { OrganizationApi } from './organization.api'
import { Organization } from './organization.model'

export class OrganizationService {
  static async info() {
    const organization = await OrganizationApi.info()
    MeService.organization.value = Organization.from(organization)
    return organization
  }

  static async updateInfo(options: {
    organizationInfo: Organization
    imagesChange?: {
      files: File[]
      imageIdsWait: number[]
      externalUrlList: string[]
    }
  }) {
    const organization = await OrganizationApi.updateInfo(options)
    MeService.organization.value = Organization.from(organization)
    return organization
  }

  static async changeEmail(email: string) {
    const organization = await OrganizationApi.changeEmail(email)
    MeService.organization.value = Organization.from(organization)
    return organization
  }

  static async saveSettings(type: keyof typeof SettingKey, plain: string) {
    return await SettingApi.saveSettings(type, plain)
  }
}
