import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { Customer } from '../customer'
import { TicketApi } from './ticket.api'
import type { TicketDetailQuery } from './ticket.dto'

export class TicketService {
  static async detail(id: number, options: TicketDetailQuery) {
    const ticket = await TicketApi.detail(id, options)

    if (ticket.customer) {
      const customer = Customer.from(ticket.customer)
      await CustomerDB.upsertOne(customer)
    }

    return ticket
  }
}