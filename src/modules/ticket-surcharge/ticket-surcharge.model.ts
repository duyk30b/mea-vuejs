import { BaseModel } from '../_base/base.model'
import { Surcharge } from '../surcharge'

export class TicketSurcharge extends BaseModel {
  id: string
  ticketId: string
  surchargeId: number
  money: number

  surcharge: Surcharge

  static init() {
    const ins = new TicketSurcharge()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = ''
    ins.surchargeId = 0
    ins.money = 0
    return ins
  }

  static blank(): TicketSurcharge {
    const ins = TicketSurcharge.init()

    ins.surcharge = Surcharge.init()
    return ins
  }

  static basic(source: TicketSurcharge) {
    const target = new TicketSurcharge()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    target._localId = String(
      source.id || source._localId || Math.random().toString(36).substring(2),
    )
    return target
  }

  static basicList(sources: TicketSurcharge[]): TicketSurcharge[] {
    return sources.map((i) => TicketSurcharge.basic(i))
  }

  static from(source: TicketSurcharge) {
    const target = TicketSurcharge.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'surcharge')) {
      target.surcharge = source.surcharge ? Surcharge.basic(source.surcharge) : source.surcharge
    }
    return target
  }

  static fromList(sourceList: TicketSurcharge[]): TicketSurcharge[] {
    return sourceList.map((i) => TicketSurcharge.from(i))
  }
}
