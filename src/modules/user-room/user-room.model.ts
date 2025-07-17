import { Room } from '../room/room.model'
import { User } from '../user/user.model'

export class UserRoom {
  oid: number
  id: number | null

  userId: number
  roomId: number

  room?: Room
  user?: User

  static init(): UserRoom {
    const ins = new UserRoom()
    ins.id = 0
    return ins
  }

  static blank(): UserRoom {
    const ins = UserRoom.init()
    return ins
  }

  static basic(source: UserRoom) {
    const target = new UserRoom()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: UserRoom[]): UserRoom[] {
    return sources.map((i) => UserRoom.basic(i))
  }

  static from(source: UserRoom) {
    const target = UserRoom.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'user')) {
      target.user = target.user ? User.basic(target.user) : target.user
    }
    if (Object.prototype.hasOwnProperty.call(source, 'room')) {
      target.room = target.room ? Room.basic(target.room) : target.room
    }

    return target
  }

  static fromList(sourceList: UserRoom[]) {
    return sourceList.map((i) => UserRoom.from(i))
  }
}
