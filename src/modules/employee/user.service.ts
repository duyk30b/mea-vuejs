import { AxiosInstance } from '@/core/axios.instance'
import { Employee } from './employee.model'

export class UserService {
	static async me() {
		const { data } = await AxiosInstance.get('/user/me')
		return Employee.fromPlain(data)
	}

	static async changePassword(oldPassword: string, newPassword: string) {
		const { data } = await AxiosInstance.patch('/user/change-password', {
			old_password: oldPassword,
			new_password: newPassword,
		})
		return { success: data.success }
	}

	static async updateInfo(employee: Partial<Employee>) {
		const employeeDto = Employee.toPlain(employee)
		const response = await AxiosInstance.patch('/user/update-info', employeeDto)

		return Employee.fromPlain(response.data)
	}
}
