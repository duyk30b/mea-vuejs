import { TicketProcedure } from '@/modules/ticket-procedure'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { Customer } from '../../customer'
import type { TicketUser } from '../../ticket-user'
import { Ticket, type TicketStatus } from '../ticket.model'
import type { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'

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
    ticketUserReceptionList: TicketUser[]
    ticketProcedureWrapList: {
      ticketProcedure: TicketProcedure
      ticketProcedureItemList: TicketProcedureItem[]
      ticketUserRequestList: TicketUser[]
    }[]
  }) {
    const {
      customer,
      ticketReception,
      ticketAttributeList,
      ticketUserReceptionList,
      ticketProcedureWrapList,
    } = body
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
      ticketUserReceptionList: ticketUserReceptionList
        .filter((i) => !!i.userId)
        .map((i) => ({ userId: i.userId, positionId: i.positionId })),
      ticketProcedureWrapList: ticketProcedureWrapList.map((tp) => {
        const { ticketProcedure, ticketProcedureItemList, ticketUserRequestList } = tp
        return {
          ticketUserRequestList: (ticketUserRequestList || [])
            .filter((i) => !!i.userId)
            .map((i) => ({
              positionId: i.positionId || 0,
              userId: i.userId || 0,
            })),
          ticketProcedureItemList: (ticketProcedureItemList || []).map((i, index) => ({
            registeredAt: i.registeredAt,
            indexSession: index,
          })),
          ticketProcedure: {
            priority: ticketProcedure.priority,
            procedureId: ticketProcedure.procedureId,
            procedureType: ticketProcedure.procedureType,

            quantity: ticketProcedure.quantity,
            totalSessions: ticketProcedure.totalSessions,

            expectedPrice: ticketProcedure.expectedPrice,
            discountMoney: ticketProcedure.discountMoney,
            discountPercent: ticketProcedure.discountPercent,
            discountType: ticketProcedure.discountType,
            actualPrice: ticketProcedure.actualPrice,

            status: ticketProcedure.status,
            paymentMoneyStatus: ticketProcedure.paymentMoneyStatus,
            createdAt: ticketProcedure.createdAt,
          },
        }
      }),
    })
    const { data } = response.data as BaseResponse<{ ticket: any }>

    const ticketResponse = Ticket.from(data.ticket)
    await ticketResponse.refreshAllData()
    return ticketResponse
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
    ticketUserReceptionList: TicketUser[]
  }) {
    const { ticketId, ticketReception, ticketAttributeList, ticketUserReceptionList } = body
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
      ticketUserReceptionList: ticketUserReceptionList
        .filter((i) => !!i.userId)
        .map((i) => ({ userId: i.userId, positionId: i.positionId })),
    })
    const { data } = response.data as BaseResponse<{ ticket: any }>

    const ticketResponse = Ticket.from(data.ticket)
    await ticketResponse.refreshAllData()
    return ticketResponse
  }
}
