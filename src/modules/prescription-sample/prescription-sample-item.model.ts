import { BaseModel } from '../_base/base.model'
import type { Product } from '../product'

export class PrescriptionSampleItem extends BaseModel {
  id: string
  prescriptionSampleId: string
  priority: number

  productId: number
  unitQuantity: number
  unitRate: number
  hintUsage: string

  product?: Product

  get unitName() {
    return this.product?.getUnitNameByRate(this.unitRate) || ''
  }

  static init(): PrescriptionSampleItem {
    const ins = new PrescriptionSampleItem()
    ins._localId = Math.random().toString(36).substring(2)

    ins.id = ''
    ins.prescriptionSampleId = ''
    ins.priority = 1
    ins.productId = 0
    ins.unitQuantity = 0
    ins.unitRate = 1
    ins.hintUsage = ''
    return ins
  }

  static blank(): PrescriptionSampleItem {
    const ins = PrescriptionSampleItem.init()
    return ins
  }

  static basic(source: PrescriptionSampleItem) {
    const target = new PrescriptionSampleItem()
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

  static basicList(sources: PrescriptionSampleItem[]): PrescriptionSampleItem[] {
    return sources.map((i) => PrescriptionSampleItem.basic(i))
  }

  static from(source: PrescriptionSampleItem) {
    const target = PrescriptionSampleItem.basic(source)

    return target
  }

  static fromList(sourceList: PrescriptionSampleItem[]) {
    return sourceList.map((i) => PrescriptionSampleItem.from(i))
  }

  static equal(a: PrescriptionSampleItem, b: PrescriptionSampleItem) {
    if (a.id != b.id) return false
    if (a.prescriptionSampleId != b.prescriptionSampleId) return false
    if (a.priority != b.priority) return false
    if (a.productId != b.productId) return false
    if (a.unitQuantity != b.unitQuantity) return false
    if (a.unitRate != b.unitRate) return false
    if (a.hintUsage != b.hintUsage) return false
    return true
  }
}
