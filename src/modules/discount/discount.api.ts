import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { DiscountDetailQuery, DiscountGetQuery, type DiscountListQuery } from './discount.dto'
import { Discount } from './discount.model'

export class DiscountApi {
  static async list(options: DiscountListQuery) {
    const params = DiscountGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/discount/list', { params })
    const { data } = response.data as FullResponse<{ discountList: any[] }>
    return Discount.fromList(data.discountList)
  }

  static async detail(id: number, options: DiscountDetailQuery = {}): Promise<Discount> {
    const params = DiscountGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/discount/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse<{ discount: any }>
    return Discount.from(data.discount)
  }

  static async createOne(discount: Discount) {
    const response = await AxiosInstance.post('/discount/create', {
      priority: discount.priority,
      isActive: discount.isActive,
      discountInteractType: discount.discountInteractType,
      discountInteractId: discount.discountInteractId,
      discountMoney: discount.discountMoney,
      discountPercent: discount.discountPercent,
      discountType: discount.discountType,
      discountRepeatType: discount.discountRepeatType,
      periodsDay: discount.periodsDay,
      periodsTime: discount.periodsTime,
    })
    const { data } = response.data as FullResponse<{ discount: any }>
    return Discount.from(data.discount)
  }

  static async updateOne(id: number, discount: Discount) {
    const response = await AxiosInstance.post(`/discount/update/${id}`, {
      priority: discount.priority,
      isActive: discount.isActive,
      // discountInteractType: discount.discountInteractType,
      // discountInteractId: discount.discountInteractId,
      discountMoney: discount.discountMoney,
      discountPercent: discount.discountPercent,
      discountType: discount.discountType,
      discountRepeatType: discount.discountRepeatType,
      periodsDay: discount.periodsDay,
      periodsTime: discount.periodsTime,
    })
    const { data } = response.data as FullResponse<{ discount: any }>
    return Discount.from(data.discount)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/discount/destroy/${id}`)
    const result = response.data as FullResponse<boolean>
    return result
  }
}
