import { LaboratoryGroup } from '../laboratory-group'
import { PrintHtml } from '../print-html'

export class Laboratory {
  id: number
  name: string // Tên

  laboratoryGroupId: number
  printHtmlId: number

  price: number
  priority: number
  descriptionDefault: string
  resultDefault: string

  updatedAt: number
  deletedAt: number

  laboratoryGroup?: LaboratoryGroup
  printHtml?: PrintHtml

  static init() {
    const ins = new Laboratory()
    ins.id = 0
    ins.laboratoryGroupId = 0
    ins.printHtmlId = 0
    ins.name = ''
    ins.price = 0
    ins.descriptionDefault = ''
    ins.resultDefault = 'Chưa phát hiện dấu hiệu bất thường'
    return ins
  }

  static blank() {
    const ins = Laboratory.init()
    ins.printHtml = PrintHtml.init()
    return ins
  }

  static basic(source: Laboratory) {
    const target = new Laboratory()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Laboratory[]): Laboratory[] {
    return sources.map((i) => Laboratory.basic(i))
  }

  static from(source: Laboratory) {
    const target = Laboratory.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'laboratoryGroup')) {
      target.laboratoryGroup = target.laboratoryGroup
        ? LaboratoryGroup.basic(target.laboratoryGroup)
        : target.laboratoryGroup
    }
    if (Object.prototype.hasOwnProperty.call(source, 'printHtml')) {
      target.printHtml = target.printHtml ? PrintHtml.basic(target.printHtml) : target.printHtml
    }
    return target
  }

  static fromList(sourceList: Laboratory[]): Laboratory[] {
    return sourceList.map((i) => Laboratory.from(i))
  }

  static equal(a: Laboratory, b: Laboratory) {
    if (a.id != b.id) return false
    if (a.name != b.name) return false
    if (a.laboratoryGroupId != b.laboratoryGroupId) return
    if (a.printHtmlId != b.printHtmlId) return
    if (a.price != b.price) return false
    if (a.resultDefault != b.resultDefault) return false
    if (a.descriptionDefault != b.descriptionDefault) return false
    if (a.updatedAt != b.updatedAt) return false
    if (a.deletedAt != b.deletedAt) return false
    return true
  }

  static equalList(a: Laboratory[], b: Laboratory[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Laboratory.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
