import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { PaymentTicketGetParams, PaymentTicketListQuery } from './payment_ticket.dto'
import { PaymentTicket } from './payment_ticket.model'

export class PaymentTicketApi {
  static async list(options: PaymentTicketListQuery) {
    const params = PaymentTicketGetParams.toQuery(options)

    const response = await AxiosInstance.get('/payment-ticket/list', { params })
    const { data } = response.data as FullResponse<{ paymentTicketList: any[] }>
    return PaymentTicket.fromList(data.paymentTicketList)
  }
}
