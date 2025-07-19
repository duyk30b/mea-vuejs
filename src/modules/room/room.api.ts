import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import { RoomDetailQuery, RoomGetQuery, RoomListQuery, type RoomPaginationQuery } from './room.dto'
import { Room } from './room.model'

export class RoomApi {
  static async pagination(query: RoomPaginationQuery) {
    const params = RoomGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/room/pagination', { params })
    const { data } = response.data as BaseResponse<{
      total: number
      page: number
      limit: number
      roomList: any[]
    }>
    return {
      roomList: Room.fromList(data.roomList),
      total: data.total,
      page: data.page,
      limit: data.limit,
    }
  }

  static async list(query: RoomListQuery) {
    const params = RoomGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/room/list', { params })
    const { data } = response.data as BaseResponse<{ roomList: any[] }>
    return Room.fromList(data.roomList)
  }

  static search: (params: RoomListQuery) => Promise<Room[]> = debounceAsync(
    async (params: RoomListQuery): Promise<Room[]> => {
      const response = await AxiosInstance.get('/room/list', { params })
      const { data } = response.data as BaseResponse<{ roomList: any }>
      return Room.fromList(data.roomList)
    },
    200,
  )

  static async detail(id: number, query: RoomDetailQuery): Promise<Room> {
    const params = RoomGetQuery.toQuery(query)

    const response = await AxiosInstance.get(`/room/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ room: any }>
    return Room.from(data.room)
  }

  static async createOne(body: { room: Room; userIdList: number[] }) {
    const { room, userIdList } = body
    const response = await AxiosInstance.post('/room/create', {
      room: {
        roomCode: room.roomCode,
        name: room.name,
        roomInteractType: room.roomInteractType,
        isCommon: room.isCommon,
      },
      userIdList,
    })
    const { data } = response.data as BaseResponse<{ room: any }>
    return Room.from(data.room)
  }

  static async updateOne(id: number, body: { room: Room; userIdList?: number[] }) {
    const { room, userIdList } = body
    const response = await AxiosInstance.patch(`/room/update/${id}`, {
      room: {
        roomCode: room.roomCode,
        name: room.name,
        roomInteractType: room.roomInteractType,
        isCommon: room.isCommon,
      },
      userIdList: userIdList ? userIdList : undefined, // không gửi lên nếu không cập nhật
    })
    const { data } = response.data as BaseResponse<{ room: any }>
    return Room.from(data.room)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/room/destroy/${id}`)
    const result = response.data as BaseResponse<{ roomDestroyed: any }>
    return result
  }
}
