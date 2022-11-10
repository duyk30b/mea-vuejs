import { AxiosInstance } from '@/core/axios.instance'
import { Organization } from './organization.model'
import type { OrganizationSettingsType } from '../../store/store.variable'

export class OrganizationService {
	static async detail(): Promise<Organization> {
		const { data } = await AxiosInstance.get('/organization/detail')
		return Organization.fromPlain(data)
	}

	static async updateInfo(organization: Partial<Organization>) {
		const organizationDto = Organization.toPlain(organization)
		const response = await AxiosInstance.patch('/organization/update', organizationDto)

		return Organization.fromPlain(response.data)
	}

	static async getAllSettings() {
		const response = await AxiosInstance.get('/organization/settings/get')
		const data = response.data as { type: OrganizationSettingsType, data: string }[]
		return data
	}

	static async saveSettings(type: OrganizationSettingsType, data: string) {
		const response = await AxiosInstance.post(`/organization/settings/upsert/${type}`, { data })
		return response.data
	}
}
