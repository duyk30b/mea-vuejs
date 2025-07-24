import { TicketProcedure } from '@/modules/ticket-procedure'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { Customer } from '../../customer'
import type { TicketUser } from '../../ticket-user'
import { Ticket, type TicketStatus, type TicketType } from '../ticket.model'

export class TicketReceptionApi {
  static async create(body: {
    customer?: Customer
    ticketReception: {
      roomId: number
      ticketType: TicketType
      status: TicketStatus
      customType: number
      customerSourceId: number
      registeredAt: number
      customerId: number
      fromAppointmentId: number
    }
    ticketAttributeList: { key: string; value: any }[]
    ticketUserList: TicketUser[]
    ticketProcedureList: TicketProcedure[]
  }) {
    const { customer, ticketReception, ticketAttributeList, ticketUserList, ticketProcedureList } =
      body
    const response = await AxiosInstance.post('/ticket/reception-create', {
      customer:
        !ticketReception.customerId && customer
          ? {
            customerCode: customer.customerCode || '',
            fullName: customer.fullName,
            phone: customer.phone,
            facebook: customer.facebook || '',
            zalo: customer.zalo || '',
            birthday: customer.birthday,
            yearOfBirth: customer.yearOfBirth,
            gender: customer.gender,
            addressProvince: customer.addressProvince,
            addressWard: customer.addressWard,
            addressStreet: customer.addressStreet,
            relative: customer.relative,
            healthHistory: customer.healthHistory,
            customerSourceId: customer.customerSourceId || 0,
            note: customer.note,
            isActive: customer.isActive,
          }
          : undefined,
      ticketReception: {
        customerId: ticketReception.customerId || 0,
        roomId: ticketReception.roomId || 0,
        fromAppointmentId: ticketReception.fromAppointmentId,
        customType: ticketReception.customType,
        customerSourceId: ticketReception.customerSourceId || 0,
        ticketType: ticketReception.ticketType,
        status: ticketReception.status,
        registeredAt: ticketReception.registeredAt,
      },
      ticketAttributeList: ticketAttributeList.map((i) => {
        return { key: i.key, value: i.value }
      }),
      ticketUserList: ticketUserList.map((i) => {
        return { id: i.id || 0, userId: i.userId || 0, roleId: i.roleId }
      }),
      ticketProcedureList: (ticketProcedureList || []).map((i) => {
        return {
          priority: i.priority,
          paymentMoneyStatus: i.paymentMoneyStatus,
          procedureId: i.procedureId,
          quantity: i.quantity,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
        }
      }),
    })
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return Ticket.from(data.ticket)
  }

  static async update(body: {
    ticketId: number
    ticketReception: {
      roomId: number
      customType: number
      customerSourceId: number
      registeredAt: number
    }
    ticketAttributeList: { key: string; value: any }[]
    ticketUserList: TicketUser[]
  }) {
    const { ticketId, ticketReception, ticketAttributeList, ticketUserList } = body
    const response = await AxiosInstance.post(`/ticket/reception-update/${ticketId}`, {
      ticketReception: {
        roomId: ticketReception.roomId,
        customType: ticketReception.customType,
        customerSourceId: ticketReception.customerSourceId || 0,
        registeredAt: ticketReception.registeredAt,
      },
      ticketAttributeList: ticketAttributeList.map((i) => {
        return { key: i.key, value: i.value != null ? i.value : '' }
      }),
      ticketUserList: ticketUserList.map((i) => {
        return { id: i.id || 0, userId: i.userId || 0, roleId: i.roleId }
      }),
    })
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return Ticket.from(data.ticket)
  }
}
