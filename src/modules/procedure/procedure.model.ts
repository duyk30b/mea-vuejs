export class Procedure {
  id: number
  name: string // Tên dịch vụ
  group: string // Nhóm dịch vụ ...
  price: number // Giá dự kiến
  isActive: 1 | 0 // Trạng thái
  updatedAt: number
  deletedAt: number

  static init() {
    const ins = new Procedure()
    ins.id = 0
    ins.price = 0
    ins.isActive = 1
    return ins
  }

  static blank() {
    const ins = Procedure.init()
    return ins
  }

  static from(source: Procedure) {
    const ins = new Procedure()
    Object.assign(ins, source)
    return ins
  }

  static fromList(sourceList: Procedure[]): Procedure[] {
    return sourceList.map((i) => Procedure.from(i))
  }
}
