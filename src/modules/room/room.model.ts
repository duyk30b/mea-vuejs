import { objectUpdatePropertyByObject } from '@/utils'
import { PickupStrategy } from '../enum'
import { User } from '../user'
import { UserRoom } from '../user-room'

export enum RoomType {
  TicketOrder = 1,
  TicketClinic = 2,
  Product = 3,
  Procedure = 4,
  Laboratory = 5,
  Radiology = 6,
}

export const RoomTypeText = {
  [RoomType.TicketOrder]: 'Phòng Bán Hàng',
  [RoomType.TicketClinic]: 'Phòng Khám',
  [RoomType.Product]: 'Phòng Sản phẩm',
  [RoomType.Procedure]: 'Phòng Dịch vụ',
  [RoomType.Laboratory]: 'Phòng Xét nghiệm',
  [RoomType.Radiology]: 'Phòng CĐHA',
}

export const ROOM_SETTING_DEFAULT = {
  general: {
    showMoneyTitle: 1,
    showMenuConsumable: 1,
    showMenuLaboratory: 1,
    showMenuRadiology: 1,
    showMenuUser: 1,
  },
  diagnosis: { icd10: 0, templateHtmlIdList: [] },
  procedure: {},
  regimen: { isEffectTotalMoney: 1 },
  consumable: {
    warehouseIdList: [0],
    searchIncludeZeroQuantity: 1,
    pickupStrategy: PickupStrategy.Inherit,
  },
  prescription: {
    warehouseIdList: [0],
    searchIncludeZeroQuantity: 1,
    pickupStrategy: PickupStrategy.Inherit,
  },
  laboratory: {},
  radiology: {},
}

export class Room {
  id: number
  code: string
  name: string
  roomType: RoomType

  isCommon: 1 | 0 // Trạng thái
  roomSetting: string
  roomSettingObj: typeof ROOM_SETTING_DEFAULT
  userRoomList?: UserRoom[]

  static init() {
    const ins = new Room()
    ins.id = 0
    ins.code = ''
    ins.name = ''
    ins.roomType = RoomType.TicketClinic
    ins.isCommon = 0
    ins.roomSetting = '{}'
    ins.roomSettingObj = JSON.parse(JSON.stringify(ROOM_SETTING_DEFAULT))
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
    target.roomSettingObj = target.roomSetting ? JSON.parse(target.roomSetting) : {}
    try {
      target.roomSettingObj = objectUpdatePropertyByObject(
        JSON.parse(JSON.stringify(ROOM_SETTING_DEFAULT)),
        JSON.parse(source?.roomSetting || '{}'),
      )
    } catch (error) {
      target.roomSettingObj = JSON.parse(JSON.stringify(ROOM_SETTING_DEFAULT))
    }

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
    if (a.isCommon != b.isCommon) return false
    if (a.roomSetting != b.roomSetting) return false
    return true
  }
}
