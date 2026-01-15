import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { PurchaseOrder } from '../purchase-order'
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
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      limit: data.limit,
      total: data.total,
      distributorList: Distributor.fromList(data.distributorList),
    }
  }

  static async list(options: DistributorListQuery) {
    const params = DistributorGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/distributor/list', { params })
    const { data, time } = response.data as FullResponse
    return {
      time: new Date(time),
      distributorList: Distributor.fromList(data.distributorList),
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
    const { data, meta } = response.data as FullResponse<{ distributor: any }>
    return Distributor.from(data.distributor)
  }

  static async createOne(distributor: Distributor) {
    const response = await AxiosInstance.post('/distributor/create', {
      fullName: distributor.fullName,
      phone: distributor.phone,
      addressProvince: distributor.addressProvince,
      addressWard: distributor.addressWard,
      addressStreet: distributor.addressStreet,
      note: distributor.note,
      isActive: distributor.isActive,
    })
    const { data } = response.data as FullResponse<{ distributor: any }>
    return Distributor.from(data.distributor)
  }

  static async updateOne(id: number, distributor: Distributor) {
    const response = await AxiosInstance.post(`/distributor/update/${id}`, {
      fullName: distributor.fullName,
      phone: distributor.phone,
      addressProvince: distributor.addressProvince,
      addressWard: distributor.addressWard,
      addressStreet: distributor.addressStreet,
      note: distributor.note,
      isActive: distributor.isActive,
    })
    const { data } = response.data as FullResponse<{ distributor: any }>
    return Distributor.from(data.distributor)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/distributor/destroy/${id}`)
    const { data } = response.data as FullResponse<{
      distributorId: number
      purchaseOrderList: PurchaseOrder[]
      success: boolean
    }>
    data.purchaseOrderList = PurchaseOrder.fromList(data.purchaseOrderList)
    return data
  }
}
