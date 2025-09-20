import { TicketProcedure } from '@/modules/ticket-procedure'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { Customer } from '../../customer'
import type { TicketUser } from '../../ticket-user'
import { Ticket, type TicketStatus } from '../ticket.model'
import type { TicketRegimen } from '@/modules/ticket-regimen'

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
    ticketRegimenAddWrapList: {
      ticketRegimenAdd: TicketRegimen
      ticketUserRequestAddList: TicketUser[]
      ticketProcedureRegimenAddWrapList: {
        totalSession: number
        ticketProcedureAdd: TicketProcedure
      }[]
    }[]
    ticketProcedureNormalWrapList: {
      ticketProcedureAdd: TicketProcedure
      ticketUserRequestAddList: TicketUser[]
    }[]
  }) {
    const {
      customer,
      ticketReception,
      ticketAttributeList,
      ticketUserReceptionList,
      ticketRegimenAddWrapList,
      ticketProcedureNormalWrapList,
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
      ticketRegimenAddWrapList: ticketRegimenAddWrapList.map((trWrap) => {
        const { ticketRegimenAdd, ticketProcedureRegimenAddWrapList, ticketUserRequestAddList } =
          trWrap
        return {
          ticketRegimenAdd: {
            regimenId: ticketRegimenAdd.regimenId,
            paymentMoneyStatus: ticketRegimenAdd.paymentMoneyStatus,

            expectedPrice: ticketRegimenAdd.expectedPrice,
            discountMoney: ticketRegimenAdd.discountMoney,
            discountPercent: ticketRegimenAdd.discountPercent,
            discountType: ticketRegimenAdd.discountType,
            actualPrice: ticketRegimenAdd.actualPrice,
          },
          ticketProcedureRegimenAddWrapList: (ticketProcedureRegimenAddWrapList || [])
            .filter((tpWrap) => tpWrap.totalSession > 0)
            .map((tpWrap, index) => {
              const { ticketProcedureAdd } = tpWrap
              return {
                ticketProcedureAdd: {
                  priority: ticketProcedureAdd.priority,
                  procedureId: ticketProcedureAdd.procedureId,
                  status: ticketProcedureAdd.status,
                  paymentMoneyStatus: ticketProcedureAdd.paymentMoneyStatus,

                  quantity: ticketProcedureAdd.quantity,

                  expectedPrice: ticketProcedureAdd.expectedPrice,
                  discountMoney: ticketProcedureAdd.discountMoney,
                  discountPercent: ticketProcedureAdd.discountPercent,
                  discountType: ticketProcedureAdd.discountType,
                  actualPrice: ticketProcedureAdd.actualPrice,
                },
                totalSession: tpWrap.totalSession,
              }
            }),
          ticketUserRequestAddList: (ticketUserRequestAddList || [])
            .filter((i) => !!i.userId)
            .map((i) => ({
              positionId: i.positionId || 0,
              userId: i.userId || 0,
            })),
        }
      }),
      ticketProcedureNormalWrapList: ticketProcedureNormalWrapList.map((tp) => {
        const { ticketProcedureAdd, ticketUserRequestAddList } = tp
        return {
          ticketProcedureAdd: {
            priority: ticketProcedureAdd.priority,
            procedureId: ticketProcedureAdd.procedureId,
            status: ticketProcedureAdd.status,
            paymentMoneyStatus: ticketProcedureAdd.paymentMoneyStatus,

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
