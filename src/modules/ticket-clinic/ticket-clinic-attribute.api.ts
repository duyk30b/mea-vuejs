import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'

export class TicketClinicAttributeApi {
  static async updateTicketAttributeList(body: {
    ticketId: number
    ticketAttributeList: { key: string; value: any }[]
  }) {
    const { ticketId, ticketAttributeList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-attribute-list`,
      {
        ticketAttributeList: ticketAttributeList.map((i) => {
          return {
            key: i.key,
            value: i.value != null ? i.value : '',
          }
        }),
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }
}
