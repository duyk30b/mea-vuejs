import { BaseModel } from '../_base/base.model'
import { Expense } from '../expense'

export class TicketExpense extends BaseModel {
  id: number
  ticketId: number
  expenseId: number
  money: number

  expense: Expense

  static init() {
    const ins = new TicketExpense()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = 0
    ins.expenseId = 0
    ins.money = 0
    return ins
  }

  static blank(): TicketExpense {
    const ins = TicketExpense.init()

    ins.expense = Expense.init()
    return ins
  }

  static basic(source: TicketExpense) {
    const target = new TicketExpense()
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

  static basicList(sources: TicketExpense[]): TicketExpense[] {
    return sources.map((i) => TicketExpense.basic(i))
  }

  static from(source: TicketExpense) {
    const target = TicketExpense.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'expense')) {
      target.expense = source.expense ? Expense.basic(source.expense) : source.expense
    }
    return target
  }

  static fromList(sourceList: TicketExpense[]): TicketExpense[] {
    return sourceList.map((i) => TicketExpense.from(i))
  }
}
