export enum RoomInteractType {
  Ticket = 1,
  Product = 2,
  Procedure = 3,
  Laboratory = 4,
  Radiology = 5,
}

export const RoomInteractTypeText = {
  [RoomInteractType.Ticket]: 'Phòng Khách hàng',
  [RoomInteractType.Product]: 'Phòng sản phẩm',
  [RoomInteractType.Procedure]: 'Phòng dịch vụ',
  [RoomInteractType.Laboratory]: 'Phòng xét nghiệm',
  [RoomInteractType.Radiology]: 'Phòng CĐHA',
}

export class Room {
  id: number
  name: string
  roomInteractType: RoomInteractType

  isCommon: 1 | 0 // Trạng thái
  showMenu: 1 | 0 // Trạng thái

  static init() {
    const ins = new Room()
    ins.id = 0

    return ins
  }

  static blank() {
    const ins = Room.init()
    ins.name = ''
    ins.isCommon = 1
    ins.showMenu = 1
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

    return target
  }

  static fromList(sourceList: Room[]): Room[] {
    return sourceList.map((i) => Room.from(i))
  }

  static equal(a: Room, b: Room) {
    if (a.id != b.id) return false
    if (a.name != b.name) return false
    if (a.roomInteractType != b.roomInteractType) return false
    if (a.isCommon != b.isCommon) return false
    if (a.showMenu != b.showMenu) return false

    return true
  }
}
