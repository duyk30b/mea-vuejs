import { Customer } from '../customer'
import { CustomerSource } from '../customer-source'
import { Ticket } from '../ticket'

export enum AppointmentStatus {
  Waiting = 1,
  Confirm = 2,
  Completed = 3,
  Cancelled = 4,
}

export const AppointmentStatusText = {
  [AppointmentStatus.Waiting]: 'Đợi xác nhận',
  [AppointmentStatus.Confirm]: 'Đã xác nhận',
  [AppointmentStatus.Completed]: 'Hoàn thành',
  [AppointmentStatus.Cancelled]: 'Hủy',
}

export class Appointment {
  id: number
  customerId: number
  customerSourceId: number

  status: AppointmentStatus
  registeredAt: number

  fromTicketId: number
  toTicketId: number

  reason: string // Ghi chú
  cancelReason: string // Lý do hủy

  customer?: Customer
  customerSource?: CustomerSource
  toTicket?: Ticket

  static init(): Appointment {
    const ins = new Appointment()
    ins.id = 0
    ins.status = AppointmentStatus.Waiting
    ins.customerId = 0
    ins.customerSourceId = 0
    return ins
  }

  static blank(): Appointment {
    const ins = Appointment.init()
    ins.customer = Customer.init()
    return ins
  }

  static basic(source: Appointment) {
    const target = new Appointment()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Appointment[]): Appointment[] {
    return sources.map((i) => Appointment.basic(i))
  }

  static from(source: Appointment) {
    const target = Appointment.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customerSource')) {
      target.customerSource = source.customerSource
        ? CustomerSource.basic(source.customerSource)
        : source.customerSource
    }
    if (Object.prototype.hasOwnProperty.call(source, 'toTicket')) {
      target.toTicket = source.toTicket ? Ticket.basic(source.toTicket) : source.toTicket
    }
    return target
  }

  static fromList(sourceList: Appointment[]) {
    return sourceList.map((i) => Appointment.from(i))
  }
}
