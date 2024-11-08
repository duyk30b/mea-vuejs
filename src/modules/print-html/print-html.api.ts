import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  PrintHtmlGetQuery,
  type PrintHtmlDetailQuery,
  type PrintHtmlGetListQuery,
  type PrintHtmlGetOneQuery,
  type PrintHtmlPaginationQuery,
} from './print-html.dto'
import { PrintHtml, PrintHtmlType } from './print-html.model'

export class PrintHtmlApi {
  static async pagination(options: PrintHtmlPaginationQuery) {
    const params = PrintHtmlGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/print-html/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: PrintHtml.fromList(data),
    }
  }

  static async getList(options: PrintHtmlGetListQuery) {
    const params = PrintHtmlGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/print-html/get-list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: PrintHtml.fromList(data),
    }
  }

  static async getOne(query: PrintHtmlGetOneQuery) {
    const params = PrintHtmlGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/print-html/get-one', { params })
    const { data, meta } = response.data as BaseResponse<{ print: any }>
    return PrintHtml.from(data.print)
  }

  static async detail(id: number, options: PrintHtmlDetailQuery = {}): Promise<PrintHtml> {
    const params = PrintHtmlGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/print-html/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ print: any }>
    return PrintHtml.from(data.print)
  }

  static async createOne(printHtml: PrintHtml) {
    const response = await AxiosInstance.post('/print-html/create', {
      key: printHtml.key,
      content: printHtml.content || '',
      radiologyId: printHtml.key === PrintHtmlType.RADIOLOGY ? printHtml.radiologyId : 0,
    })
    const { data } = response.data as BaseResponse<{ print: any }>
    return PrintHtml.from(data.print)
  }

  static async updateOne(id: number, content: string) {
    const response = await AxiosInstance.patch(`/print-html/update/${id}`, {
      content,
    })
    const { data } = response.data as BaseResponse<{ print: any }>
    return PrintHtml.from(data.print)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/print-html/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse<boolean>
    return data
  }
}