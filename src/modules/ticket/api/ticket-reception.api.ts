import { TicketProcedure } from '@/modules/ticket-procedure'
import type { TicketReception } from '@/modules/ticket-reception'
import type { TicketRegimen, TicketRegimenItem } from '@/modules/ticket-regimen'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { Customer } from '../../customer'
import type { TicketUser } from '../../ticket-user'
import { Ticket, type TicketStatus } from '../ticket.model'

export class TicketChangeReceptionApi {
  static async create(obj: {
    ticketId: string
    isPaymentEachItem: number
    customerId: number
    customer?: Customer
    ticketReception: TicketReception
    ticketAttributeList: { key: string; value: any }[]
    ticketUserReceptionList: TicketUser[]
    ticketRegimenWrapList: {
      ticketRegimenAdd: TicketRegimen
      ticketUserRequestAddList: TicketUser[]
      ticketRegimenItemAddList: TicketRegimenItem[]
    }[]
    ticketProcedureWrapList: {
      ticketProcedureAdd: TicketProcedure
      ticketUserRequestAddList: TicketUser[]
    }[]
    status: TicketStatus
    fromAppointmentId: string
  }) {
    // const {
    //   customer,
    //   ticketReception,
    //   ticketAttributeList,
    //   ticketUserReceptionList,
    //   ticketRegimenWrapList,
    //   ticketProcedureWrapList,
    // } = body
    const response = await AxiosInstance.post('/ticket/reception-create', {
      ticketId: obj.ticketId,
      isPaymentEachItem: obj.isPaymentEachItem,
      customerId: obj.customerId,
      customer:
        !obj.customerId && obj.customer
          ? {
            customerCode: obj.customer.customerCode || '',
            fullName: obj.customer.fullName,
            citizenIdCard: obj.customer.citizenIdCard || '',
            phone: obj.customer.phone,
            facebook: obj.customer.facebook || '',
            zalo: obj.customer.zalo || '',
            birthday: obj.customer.birthday,
            yearOfBirth: obj.customer.yearOfBirth,
            gender: obj.customer.gender,
            addressProvince: obj.customer.addressProvince,
            addressWard: obj.customer.addressWard,
            addressStreet: obj.customer.addressStreet,
            relative: obj.customer.relative,
            healthHistory: obj.customer.healthHistory,
            customerSourceId: obj.customer.customerSourceId || 0,
            note: obj.customer.note,
            isActive: obj.customer.isActive,
          }
          : undefined,
      ticketReceptionAdd: {
        roomId: obj.ticketReception.roomId || 0,
        customerSourceId: obj.ticketReception.customerSourceId || 0,
        receptionAt: obj.ticketReception.receptionAt,
        reason: obj.ticketReception.reason,
      },
      ticketAttributeAddList: obj.ticketAttributeList.map((i) => {
        return { key: i.key, value: i.value }
      }),
      ticketUserReceptionAddList: obj.ticketUserReceptionList
        .filter((i) => !!i.userId)
        .map((i) => ({ userId: i.userId, positionId: i.positionId })),
      ticketRegimenWrapList: [],
      ticketProcedureWrapList: obj.ticketProcedureWrapList.map((tp) => {
        const { ticketProcedureAdd, ticketUserRequestAddList } = tp
        return {
          ticketProcedureAdd: {
            priority: ticketProcedureAdd.priority,
            procedureId: ticketProcedureAdd.procedureId,
            status: ticketProcedureAdd.status,

            quantity: ticketProcedureAdd.quantity,

            expectedPrice: ticketProcedureAdd.expectedPrice,
            discountMoney: ticketProcedureAdd.discountMoney,
            discountPercent: ticketProcedureAdd.discountPercent,
            discountType: ticketProcedureAdd.discountType,
            actualPrice: ticketProcedureAdd.actualPrice,
          },
          ticketUserRequestAddList: (ticketUserRequestAddList || [])
            .filter((i) => !!i.userId)
            .map((i) => ({
              positionId: i.positionId || 0,
              userId: i.userId || 0,
            })),
        }
      }),
      fromAppointmentId: obj.fromAppointmentId,
      status: obj.status,
    })
    const { data } = response.data as BaseResponse<{ ticket: any; ticketReceptionCreated: any }>

    const ticketResponse = Ticket.from(data.ticket)
    return ticketResponse
  }

  static async destroyTicketReception(obj: { ticketId: string; ticketReceptionId: string }) {
    const { ticketId, ticketReceptionId } = obj
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/reception-destroy/${ticketReceptionId}`,
    )
    const { data } = response.data as BaseResponse
  }

  static async update(body: {
    ticketId: string
    ticketReceptionId: string
    ticketReception: TicketReception
    ticketAttributeList: { key: string; value: any }[]
    ticketUserReceptionList: TicketUser[]
  }) {
    const { ticketId, ticketReceptionId, ticketReception } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/reception-update/${ticketReceptionId}`,
      {
        ticketReceptionUpdate: {
          roomId: ticketReception.roomId,
          customerSourceId: ticketReception.customerSourceId || 0,
          receptionAt: ticketReception.receptionAt,
          reason: ticketReception.reason,
        },
        ticketAttributeUpdateList: body.ticketAttributeList.map((i) => {
          return { key: i.key, value: i.value != null ? i.value : '' }
        }),
        ticketUserReceptionUpdateList: body.ticketUserReceptionList
          .filter((i) => !!i.userId)
          .map((i) => ({ userId: i.userId, positionId: i.positionId })),
      },
    )
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      ticketReceptionModified: any
    }>

    const ticketModified = Ticket.from(data.ticketModified)
    return ticketModified
  }
}
