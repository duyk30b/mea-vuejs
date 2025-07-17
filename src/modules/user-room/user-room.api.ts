import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { UserRoom } from './user-room.model'

export class UserRoomApi {
  static async list(): Promise<UserRoom[]> {
    const response = await AxiosInstance.get('/user-room/list')
    const { data } = response.data as BaseResponse
    return UserRoom.fromList(data)
  }
}
