import { UNKNOWN_KEY } from '../enum'

export class TicketExpense {
  id: number
  ticketId: number
  key: string
  name: string
  money: number

  static init() {
    const ins = new TicketExpense()
    ins.id = 0
    ins.name = ''
    ins.key = UNKNOWN_KEY
    ins.money = 0
    return ins
  }

  static blank(): TicketExpense {
    const ins = TicketExpense.init()
    return ins
  }

  static basic(source: TicketExpense) {
    const target = new TicketExpense()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketExpense[]): TicketExpense[] {
    return sources.map((i) => TicketExpense.basic(i))
  }
}
