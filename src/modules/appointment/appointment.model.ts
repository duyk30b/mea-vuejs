import { Customer } from '../customer'

export enum AppointmentType {
  CustomerInitiated = 1, // Đã lên lịch
  Reminder = 2, // Hoàn thành
}

export enum AppointmentStatus {
  Waiting = 1, // Đợi - Nhắc khám
  Confirm = 2, // Xác nhận
  Completed = 3, // Hoàn thành
  Cancelled = 4, // Hủy
}

export class Appointment {
  id: number
  customerId: number
  time: number
  appointmentType: AppointmentType
  appointmentStatus: AppointmentStatus
  note: string // Ghi chú

  customer?: Customer

  static init(): Appointment {
    const ins = new Appointment()
    ins.id = 0
    ins.customerId = 0
    ins.appointmentType = AppointmentType.Reminder
    ins.appointmentStatus = AppointmentStatus.Waiting
    return ins
  }

  static blank(): Appointment {
    const ins = Appointment.init()
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
      target.customer = target.customer ? Customer.basic(target.customer) : target.customer
    }
    return target
  }

  static fromList(sourceList: Appointment[]) {
    return sourceList.map((i) => Appointment.from(i))
  }
}
