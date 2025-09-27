import { User } from '../user'
import { UserRoom } from '../user-room'

export enum RoomType {
  Ticket = 1,
  Product = 2,
  Procedure = 3,
  Laboratory = 4,
  Radiology = 5,
}

export const RoomTypeText = {
  [RoomType.Ticket]: 'Phòng Chính',
  [RoomType.Product]: 'Phòng Sản phẩm',
  [RoomType.Procedure]: 'Phòng Dịch vụ',
  [RoomType.Laboratory]: 'Phòng Xét nghiệm',
  [RoomType.Radiology]: 'Phòng CĐHA',
}

export enum RoomTicketStyle {
  TicketOrder = 111,
  TicketClinicGeneral = 121,
  TicketClinicObstetric = 122,
  TicketClinicEye = 123,
}

export const RoomTicketStyleText = {
  [RoomTicketStyle.TicketOrder]: 'Phòng bán hàng',
  [RoomTicketStyle.TicketClinicGeneral]: 'Phòng khám cơ bản',
  [RoomTicketStyle.TicketClinicObstetric]: 'Phòng khám sản',
  [RoomTicketStyle.TicketClinicEye]: 'Phòng khám mắt',
}

export class Room {
  id: number
  code: string
  name: string
  roomType: RoomType
  roomStyle: RoomTicketStyle

  isCommon: 1 | 0 // Trạng thái
  userRoomList?: UserRoom[]

  static init() {
    const ins = new Room()
    ins.id = 0
    ins.code = ''
    ins.name = ''
    ins.roomType = RoomType.Ticket
    ins.roomStyle = RoomTicketStyle.TicketClinicGeneral
    ins.isCommon = 0

    return ins
  }

  static blank() {
    const ins = Room.init()
    ins.userRoomList = []
    return ins
  }

  static basic(source?: Room) {
    const target = new Room()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Room[]): Room[] {
    return sources.map((i) => Room.basic(i))
  }

  static from(source?: Room) {
    const target = Room.basic(source)

    if (target.userRoomList) {
      target.userRoomList = UserRoom.basicList(target.userRoomList)
      target.userRoomList.forEach((userRoom) => {
        userRoom.room = userRoom.room ? Room.basic(userRoom.room) : userRoom.room
        userRoom.user = userRoom.user ? User.basic(userRoom.user) : userRoom.user
      })
    }

    return target
  }

  static fromList(sourceList: Room[]): Room[] {
    return sourceList.map((i) => Room.from(i))
  }

  static equal(a: Room, b: Room) {
    if (a.id != b.id) return false
    if (a.code != b.code) return false
    if (a.name != b.name) return false
    if (a.roomType != b.roomType) return false
    if (a.roomStyle != b.roomStyle) return false
    if (a.isCommon != b.isCommon) return false

    return true
  }
}
