import { Expose, Type, plainToInstance } from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'
import type { DiscountType } from '../enum'
import { Image } from '../image/image.model'
import { Radiology } from '../radiology'
import { User } from '../user'

export class VisitRadiology {
  @Expose()
  id: number

  @Expose()
  visitId: number

  @Expose()
  customerId: number

  @Expose()
  radiologyId: number

  @Expose()
  doctorId: number

  @Expose()
  expectedPrice: number

  @Expose()
  discountMoney: number

  @Expose()
  discountPercent: number

  @Expose()
  discountType: DiscountType

  @Expose()
  actualPrice: number

  @Expose()
  description: string

  @Expose()
  result: string

  @Expose()
  startedAt: number

  @Expose()
  imageIds: string

  @Expose()
  @Type(() => Image)
  imageList: Image[]

  @Expose()
  @Type(() => Radiology)
  radiology?: Radiology

  @Expose()
  @Type(() => User)
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

  static fromPlain(plain: Record<string, any>): VisitRadiology {
    return plainToInstance(VisitRadiology, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): VisitRadiology[] {
    return plains.map((i) => VisitRadiology.fromPlain(i))
  }

  static clone(root: VisitRadiology): VisitRadiology {
    const result = VisitRadiology.toBasic(root)
    if (Object.prototype.hasOwnProperty.call(root, 'radiology')) {
      result.radiology = root.radiology ? Radiology.toBasic(root.radiology) : root.radiology
    }
    if (Object.prototype.hasOwnProperty.call(root, 'doctor')) {
      result.doctor = root.doctor ? User.toBasic(root.doctor) : root.doctor
    }

    if (root.imageList) {
      result.imageList = Image.toBasics(root.imageList)
    }
    return result
  }

  static cloneList(roots: VisitRadiology[]): VisitRadiology[] {
    return roots.map((i) => VisitRadiology.clone(i))
  }
}
