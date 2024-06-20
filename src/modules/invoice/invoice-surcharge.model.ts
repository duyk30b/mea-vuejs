import { Expose, instanceToPlain } from 'class-transformer'
import { FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
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

  static toPlain(
    instance: InvoiceSurcharge,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }

  static toPlains(
    instances: InvoiceSurcharge[],
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instances.map((i) => InvoiceSurcharge.toPlain(i, type))
  }
}
