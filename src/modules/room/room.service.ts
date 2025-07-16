import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { RoomApi } from './room.api'
import type { RoomDetailQuery, RoomGetQuery, RoomListQuery, RoomPaginationQuery } from './room.dto'
import { Room } from './room.model'

const RoomDBQuery = new IndexedDBQuery<Room>()

export class RoomService {
  static loadedAll: boolean = false
  static roomList = ref<Room[]>([])
  static roomMap = ref<Record<string, Room>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        const roomAll = await RoomApi.list({ sort: { id: 'ASC' } })
        RoomService.roomList.value = roomAll
        RoomService.roomMap.value = ESArray.arrayToKeyValue(roomAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ room.service.ts:30 ~ RoomService ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !RoomService.loadedAll || options.refetch) {
        RoomService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: Room[], query: RoomGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return RoomDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = RoomDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(roomList: Room[], relation: RoomGetQuery['relation']) {
    try {
      roomList.forEach((room) => {})
    } catch (error) {
      console.log('🚀 ~ room.service.ts:78 ~ RoomService ~ error:', error)
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await RoomService.fetchAll({ refetch: !!options?.refetch })
    return RoomService.roomMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await RoomService.fetchAll({ refetch: !!options?.refetch })
    return RoomService.roomList.value
  }

  static async pagination(query: RoomPaginationQuery, options?: { refetch?: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await RoomService.fetchAll({ refetch: !!options?.refetch })

    const dataQuery = RoomService.executeQuery(RoomService.roomList.value, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)

    if (query.relation) {
      await RoomService.executeRelation(data, query.relation)
    }

    return {
      data: Room.fromList(data),
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: RoomListQuery, options?: { refetch: boolean }) {
    await RoomService.fetchAll({ refetch: !!options?.refetch })
    const data = RoomService.executeQuery(RoomService.roomList.value, query)

    return Room.fromList(data)
  }

  static async detail(
    id: number,
    query: RoomDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let room: Room | undefined
    if (options?.query) {
      room = await RoomApi.detail(id, query)
      const findIndex = RoomService.roomList.value.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        RoomService.roomList.value[findIndex] = room
        RoomService.roomMap.value[room.id] = room
      }
    } else {
      await RoomService.fetchAll({ refetch: !!options?.refetch })
      room = RoomService.roomList.value.find((i) => i.id === id)
    }

    return room ? Room.from(room) : Room.blank()
  }

  static async createOne(body: { room: Room }) {
    const room = await RoomApi.createOne(body)
    return room
  }

  static async updateOne(id: number, body: { room: Room }) {
    const room = await RoomApi.updateOne(id, body)
    return room
  }

  static async destroyOne(id: number) {
    const result = await RoomApi.destroyOne(id)
    return result
  }
}
