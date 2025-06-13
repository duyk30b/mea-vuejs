import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import { RoomDetailQuery, RoomGetQuery, RoomListQuery, type RoomPaginationQuery } from './room.dto'
import { Room } from './room.model'

export class RoomApi {
  static async pagination(options: RoomPaginationQuery) {
    const params = RoomGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/room/pagination', { params })
    const { data } = response.data as BaseResponse<{
      total: number
      page: number
      limit: number
      roomList: any[]
    }>
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Room.fromList(data.roomList),
    }
  }

  static async list(options: RoomListQuery) {
    const params = RoomGetQuery.toQuery(options)

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

  static async detail(id: number, options: RoomDetailQuery): Promise<Room> {
    const params = RoomGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/room/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ room: any }>
    return Room.from(data.room)
  }

  static async createOne(body: { room: Room }) {
    const { room } = body
    const response = await AxiosInstance.post('/room/create', {
      name: room.name,
      roomInteractType: room.roomInteractType,
      isCommon: room.isCommon,
      showMenu: room.showMenu,
    })
    const { data } = response.data as BaseResponse<{ room: any }>
    return Room.from(data.room)
  }

  static async updateOne(id: number, body: { room: Room }) {
    const { room } = body
    const response = await AxiosInstance.patch(`/room/update/${id}`, {
      name: room.name,
      roomInteractType: room.roomInteractType,
      isCommon: room.isCommon,
      showMenu: room.showMenu,
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
