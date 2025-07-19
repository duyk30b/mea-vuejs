import { ref } from 'vue'
import { ESArray } from '../../utils'
import { UserRole, UserRoleService } from '../user-role'
import { UserApi } from './user.api'
import type { UserDetailQuery, UserGetQuery, UserListQuery, UserPaginationQuery } from './user.dto'
import { User } from './user.model'
import { UserRoom, UserRoomService } from '../user-room'
import { Role, RoleService } from '../role'
import { Room, RoomService } from '../room'

export class UserService {
  static loadedAll: boolean = false
  static userAll: User[] = []
  static userMap = ref<Record<string, User>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static fetchAll = (() => {
    const start = async () => {
      try {
        const userAll = await UserApi.list({})
        UserService.userAll = userAll
        UserService.userMap.value = ESArray.arrayToKeyValue(UserService.userAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ file: user.service.ts:20 ~ fetchAll ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !UserService.loadedAll || options.refetch) {
        UserService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: User[], query: UserGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return true
      })
    }
    if (query.sort) {
      if (query.sort.id) {
        data.sort((a, b) => {
          if (query.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (query.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    return data
  }

  static async executeRelation(options: {
    userList: User[]
    relation: UserGetQuery['relation']
    refetch?: boolean
  }) {
    const { userList, relation, refetch } = options
    try {
      const userIdList = userList.map((i) => i.id)

      const [userRoleAll, roleMap, userRoomAll, roomMap] = await Promise.all([
        relation?.userRoleList ? UserRoleService.getAll({ refetch: !!refetch }) : <UserRole[]>[],
        relation?.userRoleList?.role
          ? RoleService.getMap({ refetch: !!refetch })
          : <Record<string, Role>>{},
        relation?.userRoomList ? UserRoomService.getAll({ refetch: !!refetch }) : <UserRoom[]>[],
        relation?.userRoomList?.room
          ? RoomService.getMap({ refetch: !!refetch })
          : <Record<string, Room>>{},
      ])

      userList.forEach((user) => {
        if (relation?.userRoleList) {
          user.userRoleList = userRoleAll.filter((i) => i.userId === user.id)
          if (relation?.userRoleList?.role) {
            user.userRoleList.forEach((userRole) => {
              userRole.role = roleMap[userRole.roleId]
            })
          }
        }
      })
      userList.forEach((user) => {
        if (relation?.userRoomList) {
          user.userRoomList = userRoomAll.filter((i) => i.userId === user.id)
          if (relation?.userRoomList?.room) {
            user.userRoomList.forEach((userRoom) => {
              userRoom.room = roomMap[userRoom.roomId]
            })
          }
        }
      })
    } catch (error) {
      console.log('🚀 ~ room.service.ts:72 ~ UserService ~ executeRelation ~ error:', error)
    }
  }

  static async getAll(options?: { refetch: boolean }) {
    await UserService.fetchAll({ refetch: !!options?.refetch })
    return UserService.userAll
  }

  static async getMap(options?: { refetch: boolean }) {
    await UserService.fetchAll({ refetch: !!options?.refetch })
    return UserService.userMap.value
  }

  static async pagination(query: UserPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await UserService.fetchAll({ refetch: !!options?.refetch })
    const dataQuery = UserService.executeQuery(UserService.userAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)

    if (query.relation) {
      await UserService.executeRelation({
        userList: data,
        relation: query.relation,
        refetch: !!options?.refetch,
      })
    }

    return {
      data,
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: UserListQuery, options?: { refetch?: boolean; query?: boolean }) {
    if (options?.query) {
      return UserApi.list(query)
    } else {
      await UserService.fetchAll({ refetch: !!options?.refetch })
      const data = UserService.executeQuery(UserService.userAll, query)
      if (query.relation) {
        await UserService.executeRelation({
          userList: data,
          relation: query.relation,
          refetch: !!options?.refetch,
        })
      }
      return User.fromList(data)
    }
  }

  static async detail(
    userId: number,
    query: UserDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let user: User | undefined

    if (options?.query) {
      user = await UserApi.detail(userId, query)
      const findIndex = UserService.userAll.findIndex((i) => i.id === userId)
      if (findIndex !== -1) {
        UserService.userAll[findIndex] = user
        Object.assign(UserService.userMap.value[user.id], user)
      }
    } else {
      await UserService.fetchAll({ refetch: !!options?.refetch })
      user = UserService.userMap.value[userId]
      if (query.relation) {
        await UserService.executeRelation({
          userList: [user],
          relation: query.relation,
          refetch: options?.refetch,
        })
      }
    }

    return user || User.blank()
  }

  static async createOne(body: {
    user: User
    account: { username: string; password: string }
    roleIdList: number[]
    roomIdList: number[]
  }) {
    const result = await UserApi.createOne(body)
    UserService.loadedAll = false
    UserRoleService.loadedAll = false
    UserRoomService.loadedAll = false
    return result
  }

  static async updateOne(
    id: number,
    body: {
      user: User
      account?: { username: string; password: string }
      roleIdList?: number[]
      roomIdList?: number[]
    },
  ) {
    const result = await UserApi.updateOne(id, body)
    UserService.loadedAll = false
    UserRoleService.loadedAll = false
    UserRoomService.loadedAll = false
    return result
  }

  static async deleteOne(id: number) {
    const result = await UserApi.deleteOne(id)
    UserService.loadedAll = false
    UserRoleService.loadedAll = false
    UserRoomService.loadedAll = false
    return result
  }
}
