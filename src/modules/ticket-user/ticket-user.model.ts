import { DiscountType } from '../enum'
import { Ticket } from '../ticket/ticket.model'
import { User } from '../user'

export enum TicketUserReferenceType {
  Ticket = 1,
  TicketProcedure = 2,
  TicketProduct = 3,
  TicketRadiology = 4,
}

export enum TicketUserType {
  Welcomer = 1, // Nhân viên tiếp đón
  Doctor = 2, // Bác sĩ hoặc người phụ trách
  ProcedureSales = 3, // Sale chốt dịch vụ
  ProcedureTechnicianPrimary = 4, // Kỹ thuật viên chính
  ProcedureTechnicianSecondary = 5, // Kỹ thuật viên chính
  RadiologyDoctor = 6, // Bác sĩ thực hiện cận lâm sàng
}

export class TicketUser {
  id: number
  ticketId: number
  userId: number
  referenceId: number
  referenceType: TicketUserReferenceType
  ticketUserType: TicketUserType

  bolusMoney: number
  bolusPercent: number
  bolusType: DiscountType

  createdAt: number

  ticket?: Ticket
  user?: User

  static init(): TicketUser {
    const ins = new TicketUser()
    ins.id = 0
    ins.ticketId = 0
    ins.userId = 0
    ins.referenceId = 0

    ins.bolusMoney = 0
    ins.bolusPercent = 0
    ins.bolusType = DiscountType.Percent

    return ins
  }

  static blank(): TicketUser {
    const ins = TicketUser.init()
    ins.user = User.init()
    ins.ticket = Ticket.init()
    return ins
  }

  static basic(source: TicketUser) {
    const target = new TicketUser()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketUser[]): TicketUser[] {
    return sources.map((i) => TicketUser.basic(i))
  }

  static from(source: TicketUser) {
    const target = TicketUser.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'user')) {
      target.user = source.user ? User.basic(source.user) : source.user
    }
    return target
  }

  static fromList(sourceList: TicketUser[]): TicketUser[] {
    return sourceList.map((i) => TicketUser.from(i))
  }
}
