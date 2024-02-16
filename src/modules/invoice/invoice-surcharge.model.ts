import { Expose } from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'
import { BaseModel } from '../base.model'
import { UNKNOWN_KEY } from '../enum'

export class InvoiceSurcharge extends BaseModel {
  @Expose({ groups: [FROM_PLAIN] })
  invoiceId: number

  @Expose()
  key: string

  @Expose()
  name: string

  @Expose()
  money: number

  static init() {
    const ins = new InvoiceSurcharge()
    ins.id = 0
    ins.key = UNKNOWN_KEY
    ins.name = ''
    ins.money = 0
    return ins
  }

  static blank(): InvoiceSurcharge {
    const ins = InvoiceSurcharge.init()
    return ins
  }
}
