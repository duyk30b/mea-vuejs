import { Customer } from '../customer'
import { CustomerSource } from '../customer-source'

export enum AppointmentStatus {
  Waiting = 1, // Đợi - Nhắc khám
  Confirm = 2, // Xác nhận
  Completed = 3, // Hoàn thành
  Cancelled = 4, // Hủy
}

export class Appointment {
  id: number
  customerId: number
  customerSourceId: number
  fromTicketId: number
  toTicketId: number
  registeredAt: number

  reason: string // Ghi chú
  cancelReason: string // Lý do hủy

  appointmentStatus: AppointmentStatus

  customer?: Customer
  customerSource?: CustomerSource

  static init(): Appointment {
    const ins = new Appointment()
    ins.id = 0
    ins.customerId = 0
    ins.customerSourceId = 0
    ins.appointmentStatus = AppointmentStatus.Waiting
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
    return target
  }

  static fromList(sourceList: Appointment[]) {
    return sourceList.map((i) => Appointment.from(i))
  }
}
