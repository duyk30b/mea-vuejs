import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Receipt } from '../receipt'
import {
  DistributorDetailQuery,
  DistributorGetQuery,
  type DistributorListQuery,
  type DistributorPaginationQuery,
} from './distributor.dto'
import { Distributor } from './distributor.model'

export class DistributorApi {
  static async pagination(options: DistributorPaginationQuery) {
    const params = DistributorGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/distributor/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Distributor.fromList(data),
    }
  }

  static async list(options: DistributorListQuery) {
    const params = DistributorGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/distributor/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Distributor.fromList(data),
    }
  }

  // static search = debounceAsync(async (text: string): Promise<Distributor[]> => {
  //   return await DistributorApi.list({
  //     limit: 10,
  //     filter: { searchText: text, isActive: 1 },
  //   })
  // }, 200)

  static async detail(id: number, options: DistributorDetailQuery = {}): Promise<Distributor> {
    const params = DistributorGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/distributor/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ distributor: any }>
    return Distributor.from(data.distributor)
  }

  static async createOne(distributor: Distributor) {
    const response = await AxiosInstance.post('/distributor/create', {
      fullName: distributor.fullName,
      phone: distributor.phone,
      addressProvince: distributor.addressProvince,
      addressDistrict: distributor.addressDistrict,
      addressWard: distributor.addressWard,
      addressStreet: distributor.addressStreet,
      note: distributor.note,
      isActive: distributor.isActive,
    })
    const { data } = response.data as BaseResponse<{ distributor: any }>
    return Distributor.from(data.distributor)
  }

  static async updateOne(id: number, distributor: Distributor) {
    const response = await AxiosInstance.patch(`/distributor/update/${id}`, {
      fullName: distributor.fullName,
      phone: distributor.phone,
      addressProvince: distributor.addressProvince,
      addressDistrict: distributor.addressDistrict,
      addressWard: distributor.addressWard,
      addressStreet: distributor.addressStreet,
      note: distributor.note,
      isActive: distributor.isActive,
    })
    const { data } = response.data as BaseResponse<{ distributor: any }>
    return Distributor.from(data.distributor)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/distributor/destroy/${id}`)
    const result = response.data as BaseResponse<{ distributorId?: number; receiptList: Receipt[] }>
    result.data.receiptList = Receipt.fromList(result.data.receiptList)
    return result
  }
}
