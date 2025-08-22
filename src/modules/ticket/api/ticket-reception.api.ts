import { TicketProcedure } from '@/modules/ticket-procedure'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { Customer } from '../../customer'
import type { TicketUser } from '../../ticket-user'
import { Ticket, type TicketStatus } from '../ticket.model'

export class TicketReceptionApi {
  static async create(body: {
    customer?: Customer
    ticketReception: {
      roomId: number
      status: TicketStatus
      customerSourceId: number
      registeredAt: number
      customerId: number
      fromAppointmentId: number
      note: string
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
        customerSourceId: ticketReception.customerSourceId || 0,
        status: ticketReception.status,
        registeredAt: ticketReception.registeredAt,
        note: ticketReception.note,
      },
      ticketAttributeList: ticketAttributeList.map((i) => {
        return { key: i.key, value: i.value }
      }),
      ticketUserList: ticketUserList.map((i) => {
        return { id: i.id || 0, userId: i.userId || 0, roleId: i.roleId }
      }),
      ticketProcedureList: (ticketProcedureList || []).map((tp) => {
        return {
          ticketUserList:
            tp.ticketUserList?.map((i) => ({
              id: i.id || 0,
              roleId: i.roleId || 0,
              userId: i.userId || 0,
            })) || undefined,
          ticketProcedureItemList: (tp.ticketProcedureItemList || []).map((i) => ({
            completedAt: i.completedAt,
          })),
          ticketProcedure: {
            priority: tp.priority,
            procedureId: tp.procedureId,

            quantity: tp.quantity,
            totalSessions: tp.totalSessions,

            expectedPrice: tp.expectedPrice,
            discountMoney: tp.discountMoney,
            discountPercent: tp.discountPercent,
            discountType: tp.discountType,
            actualPrice: tp.actualPrice,

            status: tp.status,
            paymentMoneyStatus: tp.paymentMoneyStatus,
            startedAt: tp.startedAt,
          },
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
      customerSourceId: number
      registeredAt: number
      note: string
    }
    ticketAttributeList: { key: string; value: any }[]
    ticketUserList: TicketUser[]
  }) {
    const { ticketId, ticketReception, ticketAttributeList, ticketUserList } = body
    const response = await AxiosInstance.post(`/ticket/${ticketId}/reception-update`, {
      ticketReception: {
        roomId: ticketReception.roomId,
        customerSourceId: ticketReception.customerSourceId || 0,
        registeredAt: ticketReception.registeredAt,
        note: ticketReception.note,
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
