import { BaseModel } from '../_base/base.model'
import { Procedure } from '../procedure'

export class RegimenItem extends BaseModel {
  id: number
  regimenId: number
  procedureId: number

  quantity: number
  gapDay: number
  procedure?: Procedure

  static init() {
    const ins = new RegimenItem()
    ins.id = 0
    ins._localId = Math.random().toString(36).substring(2)

    ins.regimenId = 0
    ins.procedureId = 0
    ins.quantity = 1
    ins.gapDay = 1

    return ins
  }

  static blank() {
    const ins = RegimenItem.init()

    return ins
  }

  static basic(source: RegimenItem) {
    const target = new RegimenItem()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    target._localId = String(
      source.id || source._localId || Math.random().toString(36).substring(2),
    )
    return target
  }

  static basicList(sources: RegimenItem[]): RegimenItem[] {
    return sources.map((i) => RegimenItem.basic(i))
  }

  static from(source: RegimenItem) {
    const target = RegimenItem.basic(source)

    if (Object.prototype.hasOwnProperty.call(source, 'procedure')) {
      target.procedure = target.procedure ? Procedure.basic(target.procedure) : target.procedure
    }

    return target
  }

  static fromList(sourceList: RegimenItem[]): RegimenItem[] {
    return sourceList.map((i) => RegimenItem.from(i))
  }

  static equal(a: RegimenItem, b: RegimenItem) {
    if (a.id != b.id) return false
    if (a.procedureId != b.procedureId) return false
    if (a.procedureId != b.procedureId) return false

    if (a.quantity != b.quantity) return false

    return true
  }

  static equalList(a: RegimenItem[], b: RegimenItem[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!RegimenItem.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
