import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  PrintHtmlGetQuery,
  type PrintHtmlDetailQuery,
  type PrintHtmlGetListQuery,
  type PrintHtmlGetOneQuery,
  type PrintHtmlPaginationQuery,
} from './print-html.dto'
import { PrintHtml } from './print-html.model'

export class PrintHtmlApi {
  static async pagination(options: PrintHtmlPaginationQuery) {
    const params = PrintHtmlGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/print-html/pagination', { params })
    const { data } = response.data as BaseResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      printHtmlList: PrintHtml.fromList(data.printHtmlList),
    }
  }

  static async getList(options: PrintHtmlGetListQuery) {
    const params = PrintHtmlGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/print-html/get-list', { params })
    const { data, time } = response.data as BaseResponse<{ printHtmlList: any[] }>
    return {
      printHtmlList: PrintHtml.fromList(data.printHtmlList),
    }
  }

  static async getOne(query: PrintHtmlGetOneQuery) {
    const params = PrintHtmlGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/print-html/get-one', { params })
    const { data, meta } = response.data as BaseResponse<{ printHtml: any }>
    return data.printHtml ? PrintHtml.from(data.printHtml) : null
  }

  static async detail(id: number, options: PrintHtmlDetailQuery = {}): Promise<PrintHtml> {
    const params = PrintHtmlGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/print-html/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ printHtml: any }>
    return PrintHtml.from(data.printHtml)
  }

  static async createOne(printHtml: PrintHtml) {
    const response = await AxiosInstance.post('/print-html/create', {
      priority: printHtml.priority || 0,
      printHtmlType: printHtml.printHtmlType || 0,
      name: printHtml.name || '',
      html: printHtml.html || '',
      css: printHtml.css || '',
      initVariable: printHtml.initVariable || '',
      dataExample: printHtml.dataExample || '',
    })
    const { data } = response.data as BaseResponse<{ printHtml: any }>
    return PrintHtml.from(data.printHtml)
  }

  static async updateOne(id: number, printHtml: PrintHtml) {
    const response = await AxiosInstance.post(`/print-html/update/${id}`, {
      priority: printHtml.priority || 0,
      printHtmlType: printHtml.printHtmlType || 0,
      name: printHtml.name || '',
      html: printHtml.html || '',
      css: printHtml.css || '',
      initVariable: printHtml.initVariable || '',
      dataExample: printHtml.dataExample || '',
    })
    const { data } = response.data as BaseResponse<{ printHtml: any }>
    return PrintHtml.from(data.printHtml)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/print-html/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse<boolean>
    return data
  }

  static async systemList() {
    const response = await AxiosInstance.get('/print-html/system-list')
    const { data, time } = response.data as BaseResponse<{ printHtmlSystem: any[] }>
    return PrintHtml.fromList(data.printHtmlSystem)
  }
}
