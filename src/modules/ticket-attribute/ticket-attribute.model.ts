import type { TicketAttributeKeyType, TicketAttributeMap } from './ticket-attribute.variable'

export class TicketAttribute {
  id: number
  ticketId: number

  key: TicketAttributeKeyType
  value: string

  static init(): TicketAttribute {
    const ins = new TicketAttribute()
    ins.id = 0
    return ins
  }

  static blank(): TicketAttribute {
    const ins = TicketAttribute.init()
    return ins
  }

  static basic(source: TicketAttribute) {
    const target = new TicketAttribute()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketAttribute[]): TicketAttribute[] {
    return sources.map((i) => TicketAttribute.basic(i))
  }

  static basicMap(sources: TicketAttribute[]) {
    const result: TicketAttributeMap = {}
    sources.forEach((i) => {
      result[i.key] = i.value
    })
    return result
  }

  static from(source: TicketAttribute) {
    const target = TicketAttribute.basic(source)
    return target
  }

  static fromList(sourceList: TicketAttribute[]): TicketAttribute[] {
    return sourceList.map((i) => TicketAttribute.from(i))
  }
}
