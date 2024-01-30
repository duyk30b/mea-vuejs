import { AxiosInstance } from '../../core/axios.instance'
import type { OrganizationSettingsType } from '../../store/store.variable'
import { Customer } from '../customer'
import { Distributor } from '../distributor'
import { Organization } from './organization.model'

export class OrganizationService {
  static async info() {
    const { data } = await AxiosInstance.get('/organization/info')
    return {
      organization: Organization.fromPlain(data.organization),
      settings: data.settings as Record<string, any>,
      distributorDefault: Distributor.fromPlain(data.distributorDefault),
      customerDefault: Customer.fromPlain(data.customerDefault),
    }
  }

  static async updateInfo(organization: Partial<Organization>) {
    const organizationDto = Organization.toPlain(organization, 'USER_UPDATE')
    const response = await AxiosInstance.patch('/organization/update', organizationDto)

    return Organization.fromPlain(response.data)
  }

  static async saveSettings(type: OrganizationSettingsType, data: string) {
    const response = await AxiosInstance.post(`/organization/settings/upsert/${type}`, { data })
    return response.data
  }
}
