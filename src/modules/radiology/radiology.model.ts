import { PrintHtml } from '../print-html'
import { RadiologyGroup } from '../radiology-group'

export class Radiology {
  id: number
  name: string

  radiologyGroupId: number
  printHtmlId: number
  priority: number

  price: number
  requestNoteDefault: string
  descriptionDefault: string
  resultDefault: string

  updatedAt: number
  deletedAt: number

  radiologyGroup?: RadiologyGroup
  printHtml?: PrintHtml

  static init() {
    const ins = new Radiology()
    ins.id = 0
    ins.name = ''

    ins.radiologyGroupId = 0
    ins.printHtmlId = 0
    ins.priority = 1
    
    ins.price = 0
    ins.requestNoteDefault = ''
    ins.descriptionDefault = ''
    ins.resultDefault = 'Chưa phát hiện dấu hiệu bất thường'
    return ins
  }

  static blank() {
    const ins = Radiology.init()
    ins.printHtml = PrintHtml.init()
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
    if (Object.prototype.hasOwnProperty.call(source, 'radiologyGroup')) {
      target.radiologyGroup = target.radiologyGroup
        ? RadiologyGroup.basic(target.radiologyGroup)
        : target.radiologyGroup
    }
    if (Object.prototype.hasOwnProperty.call(source, 'printHtml')) {
      target.printHtml = target.printHtml ? PrintHtml.basic(target.printHtml) : target.printHtml
    }
    return target
  }

  static fromList(sourceList: Radiology[]): Radiology[] {
    return sourceList.map((i) => Radiology.from(i))
  }

  static equal(a: Radiology, b: Radiology) {
    if (a.id != b.id) return false
    if (a.name != b.name) return false
    if (a.radiologyGroupId != b.radiologyGroupId) return
    if (a.printHtmlId != b.printHtmlId) return
    if (a.priority != b.priority) return false
    if (a.price != b.price) return false
    if (a.requestNoteDefault != b.requestNoteDefault) return false
    if (a.descriptionDefault != b.descriptionDefault) return false
    if (a.resultDefault != b.resultDefault) return false
    if (a.updatedAt != b.updatedAt) return false
    if (a.deletedAt != b.deletedAt) return false
    return true
  }

  static equalList(a: Radiology[], b: Radiology[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Radiology.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
