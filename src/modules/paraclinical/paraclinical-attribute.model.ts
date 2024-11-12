import { AttributeInputType } from '../enum'

export class ParaclinicalAttribute {
  id: number
  paraclinicalId: number

  code: string
  name: string // Tên

  inputType: AttributeInputType
  default: string
  options: string

  static init() {
    const ins = new ParaclinicalAttribute()
    ins.code = ''
    ins.name = ''
    ins.inputType = AttributeInputType.InputText
    ins.default = ''
    ins.options = '[]'
    return ins
  }

  static blank() {
    const ins = ParaclinicalAttribute.init()
    return ins
  }

  static basic(source: ParaclinicalAttribute) {
    const target = new ParaclinicalAttribute()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: ParaclinicalAttribute[]): ParaclinicalAttribute[] {
    return sources.map((i) => ParaclinicalAttribute.basic(i))
  }

  static from(source: ParaclinicalAttribute) {
    const target = ParaclinicalAttribute.basic(source)
    return target
  }

  static fromList(sourceList: ParaclinicalAttribute[]): ParaclinicalAttribute[] {
    return sourceList.map((i) => ParaclinicalAttribute.from(i))
  }

  static equal(a: ParaclinicalAttribute, b: ParaclinicalAttribute) {
    if (a.id != b.id) return false
    if (a.paraclinicalId != b.paraclinicalId) return false
    if (a.code != b.code) return false
    if (a.name != b.name) return false
    if (a.inputType != b.inputType) return
    if (a.default != b.default) return
    if (a.options != b.options) return
    return true
  }

  static equalList(a: ParaclinicalAttribute[], b: ParaclinicalAttribute[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!ParaclinicalAttribute.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
