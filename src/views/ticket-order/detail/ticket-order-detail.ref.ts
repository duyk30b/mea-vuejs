import { ref } from 'vue'
import { Ticket } from '../../../modules/ticket'

export const ticket = ref<Ticket>(Ticket.blank())

export enum PaymentViewType {
  Prepayment = 1,
  SendProductAndPaymentAndClose = 2,
  PaymentAndClose = 3,
  PayDebt = 4,
  RefundOverpaid = 5,
  Success = 6,
}
