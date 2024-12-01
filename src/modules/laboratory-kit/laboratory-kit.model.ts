import type { Laboratory } from '../laboratory/laboratory.model'

export class LaboratoryKit {
  id: number
  priority: number

  name: string
  laboratoryIds: string

  laboratoryList?: Laboratory[] // chỉ có ở front-end

  static init(): LaboratoryKit {
    const ins = new LaboratoryKit()
    ins.id = 0
    ins.priority = 1
    ins.laboratoryIds = JSON.stringify([])
    return ins
  }

  static blank(): LaboratoryKit {
    const ins = LaboratoryKit.init()
    return ins
  }

  static basic(source: LaboratoryKit) {
    const target = new LaboratoryKit()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: LaboratoryKit[]): LaboratoryKit[] {
    return sources.map((i) => LaboratoryKit.basic(i))
  }

  static from(source: LaboratoryKit) {
    const target = LaboratoryKit.basic(source)
    return target
  }

  static fromList(sourceList: LaboratoryKit[]) {
    return sourceList.map((i) => LaboratoryKit.from(i))
  }

  static equal(a: LaboratoryKit, b: LaboratoryKit) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.name != b.name) return false
    if (a.laboratoryIds != b.laboratoryIds) return false
    return true
  }
}
