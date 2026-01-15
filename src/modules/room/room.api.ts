import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { FullResponse } from '../_base/base-dto'
import { Ticket } from '../ticket'
import { RoomDetailQuery, RoomGetQuery, RoomListQuery, type RoomPaginationQuery } from './room.dto'
import { Room } from './room.model'

export class RoomApi {
  static async pagination(query: RoomPaginationQuery) {
    const params = RoomGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/room/pagination', { params })
    const { data } = response.data as FullResponse<{
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
    const { data } = response.data as FullResponse<{ roomList: any[] }>
    return Room.fromList(data.roomList)
  }

  static search: (params: RoomListQuery) => Promise<Room[]> = debounceAsync(
    async (params: RoomListQuery): Promise<Room[]> => {
      const response = await AxiosInstance.get('/room/list', { params })
      const { data } = response.data as FullResponse<{ roomList: any }>
      return Room.fromList(data.roomList)
    },
    200,
  )

  static async detail(id: number, query: RoomDetailQuery): Promise<Room> {
    const params = RoomGetQuery.toQuery(query)

    const response = await AxiosInstance.get(`/room/detail/${id}`, { params })
    const { data } = response.data as FullResponse<{ room: any }>
    return Room.from(data.room)
  }

  static async createOne(body: { room: Room; userIdList: number[] }) {
    const { room, userIdList } = body
    const response = await AxiosInstance.post('/room/create', {
      room: {
        code: room.code,
        name: room.name,
        roomType: room.roomType,
        roomStyle: room.roomStyle,
        isCommon: room.isCommon,
      },
      userIdList,
    })
    const { data } = response.data as FullResponse<{ room: any }>
    return Room.from(data.room)
  }

  static async updateOne(id: number, body: { room: Room; userIdList?: number[] }) {
    const { room, userIdList } = body
    const response = await AxiosInstance.post(`/room/update/${id}`, {
      room: {
        code: room.code,
        name: room.name,
        // roomType: room.roomType,
        roomStyle: room.roomStyle,
        isCommon: room.isCommon,
      },
      userIdList: userIdList ? userIdList : undefined, // không gửi lên nếu không cập nhật
    })
    const { data } = response.data as FullResponse<{ room: any }>
    return Room.from(data.room)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/room/destroy/${id}`)
    const { data } = response.data as FullResponse<{
      roomId: number
      ticketList: Ticket[]
      success: boolean
    }>
    data.ticketList = Ticket.fromList(data.ticketList)
    return data
  }

  static async mergeRoom(options: { roomIdSourceList: number[]; roomIdTarget: number }) {
    const response = await AxiosInstance.post(`/room/merge-room`, {
      roomIdSourceList: options.roomIdSourceList,
      roomIdTarget: options.roomIdTarget,
    })
    const { data } = response.data as FullResponse<boolean>
    return data
  }
}
