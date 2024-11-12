import type { AttributeLayoutType } from '../enum'
import { ParaclinicalGroup } from '../paraclinical-group'
import { PrintHtml } from '../print-html'
import { ParaclinicalAttribute } from './paraclinical-attribute.model'

export class Paraclinical {
  id: number
  name: string // Tên

  price: number // Giá dự kiến
  conclusionDefault: string

  paraclinicalGroupId: number
  attributeLayout: keyof typeof AttributeLayoutType

  updatedAt: number
  deletedAt: number

  paraclinicalGroup?: ParaclinicalGroup
  printHtml?: PrintHtml
  paraclinicalAttributeList?: ParaclinicalAttribute[]

  static init() {
    const ins = new Paraclinical()
    ins.id = 0
    ins.paraclinicalGroupId = 0
    ins.name = ''
    ins.price = 0
    ins.conclusionDefault = 'Chưa phát hiện dấu hiệu bất thường'
    ins.attributeLayout = 'Table'
    return ins
  }

  static blank() {
    const ins = Paraclinical.init()
    ins.printHtml = PrintHtml.init()
    ins.paraclinicalAttributeList = []
    return ins
  }

  static basic(source: Paraclinical) {
    const target = new Paraclinical()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Paraclinical[]): Paraclinical[] {
    return sources.map((i) => Paraclinical.basic(i))
  }

  static from(source: Paraclinical) {
    const target = Paraclinical.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'paraclinicalGroup')) {
      target.paraclinicalGroup = target.paraclinicalGroup
        ? ParaclinicalGroup.basic(target.paraclinicalGroup)
        : target.paraclinicalGroup
    }
    if (Object.prototype.hasOwnProperty.call(source, 'printHtml')) {
      target.printHtml = target.printHtml ? PrintHtml.basic(target.printHtml) : target.printHtml
    }
    if (target.paraclinicalAttributeList) {
      target.paraclinicalAttributeList = ParaclinicalAttribute.basicList(
        target.paraclinicalAttributeList
      )
    }
    return target
  }

  static fromList(sourceList: Paraclinical[]): Paraclinical[] {
    return sourceList.map((i) => Paraclinical.from(i))
  }

  static equal(a: Paraclinical, b: Paraclinical) {
    if (a.id != b.id) return false
    if (a.name != b.name) return false
    if (a.price != b.price) return false
    if (a.conclusionDefault != b.conclusionDefault) return false
    if (a.paraclinicalGroupId != b.paraclinicalGroupId) return
    if (a.attributeLayout != b.attributeLayout) return
    if (a.updatedAt != b.updatedAt) return
    if (a.deletedAt != b.deletedAt) return
    return true
  }

  static equalList(a: Paraclinical[], b: Paraclinical[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Paraclinical.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
