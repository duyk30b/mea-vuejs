import { ExpenseService } from '../expense'
import type { TicketExpense } from './ticket-expense.model'

export class TicketExpenseService {
  static async refreshRelation(data?: TicketExpense[]) {
    if (!data?.length) return
    const expenseMap = await ExpenseService.getMap()
    data.forEach((i) => {
      i.expense = expenseMap[i.expenseId]
    })
  }
}
