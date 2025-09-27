import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'

export class TicketChangeAttributeApi {
  static async updateDiagnosis(options: {
    ticketId: string
    note: string
    imagesChange?: {
      files: File[]
      imageIdWaitList: number[]
      externalUrlList: string[]
    }
    ticketAttributeChangeList?: { key: string; value: any }[]
    ticketAttributeKeyList: string[]
  }) {
    const { ticketId, imagesChange, ticketAttributeChangeList } = options

    const formData = new FormData()
    formData.append('ticketAttributeKeyList', JSON.stringify(options.ticketAttributeKeyList))
    formData.append('note', options.note)

    if (imagesChange) {
      // imagesChange.files.forEach((file) => formData.append('files', file))
      const imagesChangeStr = JSON.stringify({
        imageIdWaitList: imagesChange.imageIdWaitList,
        externalUrlList: imagesChange.externalUrlList,
      })
      formData.append('imagesChange', imagesChangeStr)
    }
    if (ticketAttributeChangeList) {
      const ticketAttributeChangeListStr = JSON.stringify(
        ticketAttributeChangeList.map((i) => {
          return { key: i.key, value: i.value }
        }),
      )
      formData.append('ticketAttributeChangeList', ticketAttributeChangeListStr)
    }

    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/attribute/update-diagnosis`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketAttributeList(body: {
    ticketId: string
    ticketAttributeList: { key: string; value: any }[]
  }) {
    const { ticketId, ticketAttributeList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/attribute/update-ticket-attribute-list`,
      {
        ticketAttributeList: ticketAttributeList.map((i) => {
          return {
            key: i.key,
            value: i.value != null ? i.value : '',
          }
        }),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }
}
