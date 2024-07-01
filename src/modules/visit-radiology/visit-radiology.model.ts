import type { DiscountType } from '../enum'
import { Image } from '../image/image.model'
import { Radiology } from '../radiology'
import { User } from '../user'

export class VisitRadiology {
  id: number
  visitId: number
  customerId: number
  radiologyId: number
  doctorId: number
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number
  description: string
  result: string
  startedAt: number
  imageIds: string
  imageList: Image[]
  radiology?: Radiology
  doctor?: User

  static init(): VisitRadiology {
    const ins = new VisitRadiology()
    ins.id = 0
    ins.imageIds = '[]'
    return ins
  }

  static blank(): VisitRadiology {
    const ins = VisitRadiology.init()
    ins.imageList = []
    return ins
  }

  static from(source: VisitRadiology) {
    const target = new VisitRadiology()
    Object.assign(target, source)
    if (Object.prototype.hasOwnProperty.call(source, 'radiology')) {
      if (!source.radiology) {
        target.radiology = source.radiology
      } else {
        const radiology = new Radiology()
        Object.assign(radiology, source.radiology)
        target.radiology = radiology
      }
    }
    if (Object.prototype.hasOwnProperty.call(source, 'doctor')) {
      if (!source.doctor) {
        target.doctor = source.doctor
      } else {
        const doctor = new User()
        Object.assign(doctor, source.doctor)
        target.doctor = doctor
      }
    }
    if (source.imageList) {
      target.imageList = source.imageList.map((i) => {
        const image = new Image()
        Object.assign(image, i)
        return image
      })
    }
    return target
  }

  static fromList(sourceList: VisitRadiology[]): VisitRadiology[] {
    return sourceList.map((i) => VisitRadiology.from(i))
  }

  static toBasic(root: VisitRadiology) {
    const ins = new VisitRadiology()
    Object.assign(ins, root)
    delete ins.radiology
    delete ins.doctor
    return ins
  }

  static toBasics(roots: VisitRadiology[]): VisitRadiology[] {
    return roots.map((i) => VisitRadiology.toBasic(i))
  }
}
