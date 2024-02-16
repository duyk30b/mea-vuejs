import { Expose } from 'class-transformer'
import { BaseModel } from '../base.model'
import { UNKNOWN_KEY } from '../enum'
import { FROM_PLAIN } from '../_base/base-expose'

export class InvoiceExpense extends BaseModel {
  @Expose({ groups: [FROM_PLAIN] })
  invoiceId: number

  @Expose()
  key: string

  @Expose()
  name: string

  @Expose()
  money: number

  static init() {
    const ins = new InvoiceExpense()
    ins.id = 0
    ins.name = ''
    ins.key = UNKNOWN_KEY
    ins.money = 0
    return ins
  }

  static blank(): InvoiceExpense {
    const ins = InvoiceExpense.init()
    return ins
  }
}
