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

  static basic(source?: Procedure) {
    const target = new Procedure()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Procedure[]): Procedure[] {
    return sources.map((i) => Procedure.basic(i))
  }

  static from(source?: Procedure) {
    const target = Procedure.basic(source)
    return target
  }

  static fromList(sourceList: Procedure[]): Procedure[] {
    return sourceList.map((i) => Procedure.from(i))
  }
}
