import { AxiosInstance } from '../../core/axios.instance'
import { User } from './user.model'

export class MeApi {
  static async info() {
    const { data } = await AxiosInstance.get('/me/info')
    return User.fromPlain(data)
  }

  static async changePassword(oldPassword: string, newPassword: string) {
    const { data } = await AxiosInstance.patch('/me/change-password', {
      oldPassword,
      newPassword,
    })
    return { success: data.success }
  }

  static async updateInfo(user: User) {
    const userDto = User.toPlain(user, 'USER_UPDATE')
    const response = await AxiosInstance.patch('/me/update-info', userDto)

    return User.fromPlain(response.data)
  }
}
