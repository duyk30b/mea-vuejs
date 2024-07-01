import { BaseModel } from '../base.model'
import { UNKNOWN_KEY } from '../enum'

export class VisitExpense extends BaseModel {
  visitId: number
  key: string
  name: string
  money: number

  static init() {
    const ins = new VisitExpense()
    ins.id = 0
    ins.name = ''
    ins.key = UNKNOWN_KEY
    ins.money = 0
    return ins
  }

  static blank(): VisitExpense {
    const ins = VisitExpense.init()
    return ins
  }
}
