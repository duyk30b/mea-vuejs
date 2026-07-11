import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
  TemplateHtmlGetQuery,
  type TemplateHtmlDetailQuery,
  type TemplateHtmlGetListQuery,
  type TemplateHtmlGetOneQuery,
  type TemplateHtmlPaginationQuery,
} from './template-html.dto'
import { TemplateHtml } from './template-html.model'

export class TemplateHtmlApi {
  static async pagination(options: TemplateHtmlPaginationQuery) {
    const params = TemplateHtmlGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/template-html/pagination', { params })
    const { data } = response.data as FullResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      templateHtmlList: TemplateHtml.fromList(data.templateHtmlList),
    }
  }

  static async getList(options: TemplateHtmlGetListQuery) {
    const params = TemplateHtmlGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/template-html/get-list', { params })
    const { data, time } = response.data as FullResponse<{ templateHtmlList: any[] }>
    return {
      templateHtmlList: TemplateHtml.fromList(data.templateHtmlList),
    }
  }

  static async getOne(query: TemplateHtmlGetOneQuery) {
    const params = TemplateHtmlGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/template-html/get-one', { params })
    const { data, meta } = response.data as FullResponse<{ templateHtml: any }>
    return data.templateHtml ? TemplateHtml.from(data.templateHtml) : null
  }

  static async detail(id: number, options: TemplateHtmlDetailQuery = {}): Promise<TemplateHtml> {
    const params = TemplateHtmlGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/template-html/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse<{ templateHtml: any }>
    return TemplateHtml.from(data.templateHtml)
  }

  static async createOne(templateHtml: TemplateHtml) {
    const response = await AxiosInstance.post('/template-html/create', {
      priority: templateHtml.priority || 0,
      templateHtmlType: templateHtml.templateHtmlType || 0,
      name: templateHtml.name || '',
      htmlPrint: templateHtml.htmlPrint || '',
      cssPrint: templateHtml.cssPrint || '',
      htmlInput: templateHtml.htmlInput || '',
      jsInput: templateHtml.jsInput || '',
      initVariable: templateHtml.initVariable || '',
      dataExample: templateHtml.dataExample || '',
    })
    const { data } = response.data as FullResponse<{ templateHtml: any }>
    return TemplateHtml.from(data.templateHtml)
  }

  static async updateOne(id: number, templateHtml: TemplateHtml) {
    const response = await AxiosInstance.post(`/template-html/update/${id}`, {
      priority: templateHtml.priority || 0,
      templateHtmlType: templateHtml.templateHtmlType || 0,
      name: templateHtml.name || '',
      htmlPrint: templateHtml.htmlPrint || '',
      cssPrint: templateHtml.cssPrint || '',
      htmlInput: templateHtml.htmlInput || '',
      jsInput: templateHtml.jsInput || '',
      initVariable: templateHtml.initVariable || '',
      dataExample: templateHtml.dataExample || '',
    })
    const { data } = response.data as FullResponse<{ templateHtml: any }>
    return TemplateHtml.from(data.templateHtml)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/template-html/destroy/${id}`)
    const { data, meta } = response.data as FullResponse<boolean>
    return data
  }

  static async systemList() {
    const response = await AxiosInstance.get('/template-html/system-list')
    const { data, time } = response.data as FullResponse<{ templateHtmlSystem: any[] }>
    return TemplateHtml.fromList(data.templateHtmlSystem)
  }
}
