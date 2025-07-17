import { ref } from 'vue'
import { UserRoomApi } from './user-room.api'
import { UserRoom } from './user-room.model'

export class UserRoomService {
  static loadedAll: boolean = false

  static userRoomAll = ref<UserRoom[]>([])
  static userRoomMapList = ref<Record<string, UserRoom[]>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static fetchAll = (() => {
    const start = async () => {
      try {
        const userRoomAll = await UserRoomApi.list()

        const userRoomMapList: Record<string, UserRoom[]> = {}
        userRoomAll.forEach((i) => {
          const key = i.roomId
          if (!userRoomMapList[key]) userRoomMapList[key] = []
          userRoomMapList[key].push(i)
        })

        UserRoomService.userRoomAll.value = userRoomAll
        UserRoomService.userRoomMapList.value = userRoomMapList
      } catch (error: any) {
        console.log('🚀 ~ user-room.service.ts:27 ~ UserRoomService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !UserRoomService.loadedAll || options.refetch) {
        fetching = start()
        UserRoomService.loadedAll = true
      }
      await fetching
    }
  })()

  static async getMapList(options?: { refetch: boolean }) {
    await UserRoomService.fetchAll({ refetch: !!options?.refetch })
    return UserRoomService.userRoomMapList.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await UserRoomService.fetchAll({ refetch: !!options?.refetch })
    return UserRoomService.userRoomAll.value
  }
}
