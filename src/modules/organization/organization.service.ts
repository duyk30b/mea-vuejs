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

  static async updateInfo(body: Organization) {
    const organization = await OrganizationApi.updateInfo(body)
    MeService.organization.value = Organization.from(organization)
    return organization
  }

  static async updateInfoAndLogo(body: Organization, file: File) {
    const organization = await OrganizationApi.updateInfoAndLogo(body, file)
    MeService.organization.value = Organization.from(organization)
    return organization
  }

  static async changeEmail(email: string) {
    const organization = await OrganizationApi.changeEmail(email)
    MeService.organization.value = Organization.from(organization)
    return organization
  }

  static async saveSettings(type: SettingKey, plain: string) {
    return await SettingApi.saveSettings(type, plain)
  }
}
