export class Radiology {
  id: number
  name: string // Tên
  price: number // Giá dự kiến
  descriptionDefault: string
  resultDefault: string
  updatedAt: number
  deletedAt: number

  static init() {
    const ins = new Radiology()
    ins.id = 0
    ins.price = 0
    return ins
  }

  static blank() {
    const ins = Radiology.init()
    return ins
  }

  static from(source: Radiology) {
    const target = new Radiology()
    Object.assign(target, source)
    return target
  }

  static fromList(sourceList: Radiology[]): Radiology[] {
    return sourceList.map((i) => Radiology.from(i))
  }
}
