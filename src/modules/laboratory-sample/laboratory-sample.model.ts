import type { Laboratory } from '../laboratory/laboratory.model'

export class LaboratorySample {
  id: number
  priority: number

  name: string
  laboratoryIds: string

  laboratoryList?: Laboratory[] // chỉ có ở front-end

  static init(): LaboratorySample {
    const ins = new LaboratorySample()
    ins.id = 0
    ins.priority = 1
    ins.laboratoryIds = JSON.stringify([])
    return ins
  }

  static blank(): LaboratorySample {
    const ins = LaboratorySample.init()
    return ins
  }

  static basic(source: LaboratorySample) {
    const target = new LaboratorySample()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: LaboratorySample[]): LaboratorySample[] {
    return sources.map((i) => LaboratorySample.basic(i))
  }

  static from(source: LaboratorySample) {
    const target = LaboratorySample.basic(source)
    return target
  }

  static fromList(sourceList: LaboratorySample[]) {
    return sourceList.map((i) => LaboratorySample.from(i))
  }

  static equal(a: LaboratorySample, b: LaboratorySample) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.name != b.name) return false
    if (a.laboratoryIds != b.laboratoryIds) return false
    return true
  }
}
