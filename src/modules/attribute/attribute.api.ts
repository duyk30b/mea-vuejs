import { AxiosInstance } from '@/core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
  AttributeDetailQuery,
  AttributeGetQuery,
  AttributeListQuery,
  type AttributePaginationQuery,
} from './attribute.dto'
import { Attribute } from './attribute.model'

export class AttributeApi {
  static async pagination(query: AttributePaginationQuery) {
    const params = AttributeGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/attribute/pagination', { params })
    const { data } = response.data as FullResponse<{
      total: number
      page: number
      limit: number
      attributeList: any[]
    }>
    return {
      attributeList: Attribute.fromList(data.attributeList),
      total: data.total,
      page: data.page,
      limit: data.limit,
    }
  }

  static async list(query: AttributeListQuery) {
    const params = AttributeGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/attribute/list', { params })
    const { data } = response.data as FullResponse<{ attributeList: any[] }>
    return Attribute.fromList(data.attributeList)
  }

  static async detail(id: number, query: AttributeDetailQuery): Promise<Attribute> {
    const params = AttributeGetQuery.toQuery(query)

    const response = await AxiosInstance.get(`/attribute/detail/${id}`, { params })
    const { data } = response.data as FullResponse<{ attribute: any }>
    return Attribute.from(data.attribute)
  }

  static async upsertOne(body: { attribute: Attribute }) {
    const { attribute } = body
    const response = await AxiosInstance.post('/attribute/upsert', {
      key: attribute.key,
      description: attribute.description,
      valueExample: attribute.valueExample,
    })
    const { data } = response.data as FullResponse<{ attribute: any }>
    return Attribute.from(data.attribute)
  }

  static async destroyOne(param: { key: string }) {
    const { key } = param
    const response = await AxiosInstance.post(`/attribute/destroy/${key}`)
    const { data } = response.data as FullResponse
    return data
  }
}
