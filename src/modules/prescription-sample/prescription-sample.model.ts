import { User } from '../user'
import { PrescriptionSampleItem } from './prescription-sample-item.model'

export class PrescriptionSample {
  id: string
  userId: number
  priority: number

  name: string

  prescriptionSampleItemList: PrescriptionSampleItem[] // chỉ có ở front-end
  user: User

  static init(): PrescriptionSample {
    const ins = new PrescriptionSample()
    ins.id = ''
    ins.userId = 0
    ins.priority = 1
    ins.name = ''
    ins.prescriptionSampleItemList = []
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

    if (target.prescriptionSampleItemList) {
      target.prescriptionSampleItemList = PrescriptionSampleItem.basicList(target.prescriptionSampleItemList)
    }
    if (Object.prototype.hasOwnProperty.call(source, 'user')) {
      target.user = target.user ? User.basic(target.user) : target.user
    }
    return target
  }

  static fromList(sourceList: PrescriptionSample[]) {
    return sourceList.map((i) => PrescriptionSample.from(i))
  }

  static equal(a: PrescriptionSample, b: PrescriptionSample) {
    if (a.id != b.id) return false
    if (a.userId != b.userId) return false
    if (a.priority != b.priority) return false
    if (a.name != b.name) return false
    return true
  }
}
