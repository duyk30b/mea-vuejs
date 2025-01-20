import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { TicketLaboratory } from '../ticket-laboratory'

export class TicketClinicLaboratoryApi {
  static async addTicketLaboratoryList(body: {
    ticketId: number
    ticketLaboratoryList: TicketLaboratory[]
  }) {
    const { ticketId, ticketLaboratoryList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/add-ticket-laboratory-list`,
      {
        ticketLaboratoryList: ticketLaboratoryList.map((i) => ({
          priority: i.priority,
          laboratoryId: i.laboratoryId,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
        })),
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketLaboratory(body: { ticketId: number; ticketLaboratoryId: number }) {
    const { ticketId, ticketLaboratoryId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-laboratory/${ticketLaboratoryId}`
    )
    const { data } = response.data as BaseResponse<boolean>
  }
}
