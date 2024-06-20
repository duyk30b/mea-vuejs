import { Expose, instanceToPlain } from 'class-transformer'
import { BaseModel } from '../base.model'
import { UNKNOWN_KEY } from '../enum'
import { FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'

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

  static toPlain(
    instance: InvoiceExpense,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }

  static toPlains(
    instances: InvoiceExpense[],
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instances.map((i) => InvoiceExpense.toPlain(i, type))
  }
}
