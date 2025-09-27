import { BaseModel } from '../_base/base.model'
import { CommissionCalculatorType, Position, PositionType } from '../position'
import type { Role } from '../role'
import type { TicketProcedure } from '../ticket-procedure'
import type { TicketRegimen } from '../ticket-regimen'
import { Ticket } from '../ticket/ticket.model'
import { User } from '../user'

export class TicketUser extends BaseModel {
  id: string
  ticketId: string
  roleId: number
  userId: number
  positionId: number

  positionType: PositionType
  positionInteractId: number // procedureId hoặc productId hoặc radiologyId

  ticketItemId: string // ticketProcedureId hoặc ticketProductId hoặc ticketRadiologyId

  ticketItemExpectedPrice: number
  ticketItemActualPrice: number

  quantity: number

  commissionCalculatorType: CommissionCalculatorType
  commissionPercentActual: number
  commissionPercentExpected: number
  commissionMoney: number

  createdAt: number

  ticket?: Ticket
  user?: User
  role?: Role
  position?: Position

  ticketProcedure?: TicketProcedure // chỉ convert tại màn TicketUserContainer
  ticketRegimen?: TicketRegimen // chỉ convert tại màn TicketUserContainer

  static init(): TicketUser {
    const ins = new TicketUser()
    // ins.id = 0
    ins._localId = Math.random().toString(36).substring(2)

    ins.ticketId = ''
    ins.userId = 0
    ins.roleId = 0

    ins.positionType = PositionType.Reception
    ins.positionInteractId = 0
    ins.ticketItemId = ''

    ins.commissionCalculatorType = CommissionCalculatorType.VND
    ins.commissionMoney = 0
    ins.commissionPercentActual = 0
    ins.commissionPercentExpected = 0

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
    target._localId = String(
      source.id || source._localId || Math.random().toString(36).substring(2),
    )
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

  static equal(a: TicketUser, b: TicketUser) {
    if (a.id != b.id) return false
    if (a.ticketId != b.ticketId) return false
    if (a.roleId != b.roleId) return false
    if (a.userId != b.userId) return false
    if (a.positionId != b.positionId) return false

    if (a.positionType != b.positionType) return false
    if (a.positionInteractId != b.positionInteractId) return false
    if (a.ticketItemId != b.ticketItemId) return false

    if (a.quantity != b.quantity) return false

    if (a.commissionCalculatorType != b.commissionCalculatorType) return false
    if (a.commissionPercentActual != b.commissionPercentActual) return false
    if (a.commissionPercentExpected != b.commissionPercentExpected) return false
    if (a.commissionMoney != b.commissionMoney) return false
    return true
  }

  static equalList(a: TicketUser[], b: TicketUser[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketUser.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
