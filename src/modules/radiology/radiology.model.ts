import type { RadiologyGroup } from '../radiology-group'

export class Radiology {
  id: number
  name: string // Tên

  radiologyGroupId: number

  price: number // Giá dự kiến
  descriptionDefault: string
  resultDefault: string

  updatedAt: number
  deletedAt: number

  radiologyGroup?: RadiologyGroup

  static init() {
    const ins = new Radiology()
    ins.id = 0
    ins.radiologyGroupId = 0
    ins.price = 0
    ins.name = ''
    ins.descriptionDefault = ''
    ins.resultDefault = ''
    return ins
  }

  static blank() {
    const ins = Radiology.init()
    return ins
  }

  static basic(source: Radiology) {
    const target = new Radiology()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Radiology[]): Radiology[] {
    return sources.map((i) => Radiology.basic(i))
  }

  static from(source: Radiology) {
    const target = Radiology.basic(source)
    return target
  }

  static fromList(sourceList: Radiology[]): Radiology[] {
    return sourceList.map((i) => Radiology.from(i))
  }
}
