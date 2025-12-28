
export class TicketPaymentDetail {
  id: string
  ticketId: string
  paidWait: number
  paidItem: number
  paidSurcharge: number
  paidDiscount: number

  debtItem: number
  debtSurcharge: number
  debtDiscount: number

  static init(): TicketPaymentDetail {
    const ins = new TicketPaymentDetail()
    ins.id = ''
    ins.ticketId = ''
    ins.paidWait = 0
    ins.paidItem = 0
    ins.paidSurcharge = 0
    ins.paidDiscount = 0
    ins.debtItem = 0
    ins.debtSurcharge = 0
    ins.debtDiscount = 0
    return ins
  }

  static blank(): TicketPaymentDetail {
    const ins = TicketPaymentDetail.init()
    return ins
  }

  static basic(source: TicketPaymentDetail) {
    const target = new TicketPaymentDetail()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketPaymentDetail[]): TicketPaymentDetail[] {
    return sources.map((i) => TicketPaymentDetail.basic(i))
  }

  static from(source: TicketPaymentDetail) {
    const target = TicketPaymentDetail.basic(source)

    return target
  }

  static fromList(roots: TicketPaymentDetail[]) {
    return roots.map((i) => TicketPaymentDetail.from(i))
  }
}
