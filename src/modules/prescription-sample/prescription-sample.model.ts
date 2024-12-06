import { Product } from '../product'

export type MedicineType = {
  productId: number
  quantity: number
  hintUsage: string
  product?: Product
}

export class PrescriptionSample {
  id: number
  priority: number

  name: string
  medicines: string

  medicineList: MedicineType[] // chỉ có ở front-end

  static init(): PrescriptionSample {
    const ins = new PrescriptionSample()
    ins.id = 0
    ins.priority = 1
    ins.medicines = JSON.stringify([])
    ins.medicineList = []
    return ins
  }

  static blank(): PrescriptionSample {
    const ins = PrescriptionSample.init()
    return ins
  }

  static basic(source: PrescriptionSample) {
    const target = new PrescriptionSample()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: PrescriptionSample[]): PrescriptionSample[] {
    return sources.map((i) => PrescriptionSample.basic(i))
  }

  static from(source: PrescriptionSample) {
    const target = PrescriptionSample.basic(source)

    if (target.medicineList) {
      target.medicineList = source.medicineList.map((i) => {
        return {
          ...i,
          product: i.product ? Product.basic(i.product) : i.product,
        }
      })
    }
    return target
  }

  static fromList(sourceList: PrescriptionSample[]) {
    return sourceList.map((i) => PrescriptionSample.from(i))
  }

  static equal(a: PrescriptionSample, b: PrescriptionSample) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.name != b.name) return false
    if (a.medicines != b.medicines) return false
    return true
  }
}
