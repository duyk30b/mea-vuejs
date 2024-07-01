import { BaseModel } from '../base.model'
import { UNKNOWN_KEY } from '../enum'

export class VisitSurcharge extends BaseModel {
  visitId: number
  key: string
  name: string
  money: number

  static init() {
    const ins = new VisitSurcharge()
    ins.id = 0
    ins.key = UNKNOWN_KEY
    ins.name = ''
    ins.money = 0
    return ins
  }

  static blank(): VisitSurcharge {
    const ins = VisitSurcharge.init()
    return ins
  }
}
