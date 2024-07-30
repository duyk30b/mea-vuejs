import { UNKNOWN_KEY } from '../enum'

export class TicketSurcharge {
  id: number
  ticketId: number
  key: string
  name: string
  money: number

  static init() {
    const ins = new TicketSurcharge()
    ins.id = 0
    ins.key = UNKNOWN_KEY
    ins.name = ''
    ins.money = 0
    return ins
  }

  static blank(): TicketSurcharge {
    const ins = TicketSurcharge.init()
    return ins
  }

  static basic(source: TicketSurcharge) {
    const target = new TicketSurcharge()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketSurcharge[]): TicketSurcharge[] {
    return sources.map((i) => TicketSurcharge.basic(i))
  }
}
