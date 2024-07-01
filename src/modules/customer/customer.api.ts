import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import { USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { CustomerGetQuery, CustomerListQuery, CustomerPaginationQuery } from './customer.dto'
import { Customer } from './customer.model'

export class CustomerApi {
  static async pagination(options: CustomerPaginationQuery) {
    const params = CustomerGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      data: Customer.fromList(data),
      meta,
    }
  }

  static async list(options: CustomerListQuery) {
    const params = CustomerGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Customer.fromList(data),
    }
  }

  // static search = debounceAsync(async (text: string): Promise<Customer[]> => {
  //   return await CustomerApi.list({
  //     limit: 10,
  //     filter: { searchText: text, isActive: 1 },
  //   })
  // }, 200)

  static async detail(id: number): Promise<Customer> {
    const response = await AxiosInstance.get(`/customer/detail/${id}`)
    const { data } = response.data as BaseResponse<{ customer: any }>
    return Customer.from(data.customer)
  }

  static async createOne(customer: Customer) {
    const response = await AxiosInstance.post('/customer/create', {
      fullName: customer.fullName,
      phone: customer.phone,
      birthday: customer.birthday,
      gender: customer.gender,
      identityCard: customer.identityCard, // số căn cước
      addressProvince: customer.addressProvince,
      addressDistrict: customer.addressDistrict,
      addressWard: customer.addressWard,
      addressStreet: customer.addressStreet,
      relative: customer.relative, // người thân
      healthHistory: customer.healthHistory, // Tiền sử bệnh
      note: customer.note,
      isActive: customer.isActive, // Trạng thái
    })
    const { data } = response.data as BaseResponse<{ customer: any }>
    return Customer.from(data.customer)
  }

  static async updateOne(id: number, customer: Customer) {
    const response = await AxiosInstance.patch(`/customer/update/${id}`, {
      fullName: customer.fullName,
      phone: customer.phone,
      birthday: customer.birthday,
      gender: customer.gender,
      identityCard: customer.identityCard, // số căn cước
      addressProvince: customer.addressProvince,
      addressDistrict: customer.addressDistrict,
      addressWard: customer.addressWard,
      addressStreet: customer.addressStreet,
      relative: customer.relative, // người thân
      healthHistory: customer.healthHistory, // Tiền sử bệnh
      note: customer.note,
      isActive: customer.isActive, // Trạng thái
    })
    const { data } = response.data as BaseResponse<{ customer: any }>
    return Customer.from(data.customer)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/customer/delete/${id}`)
    const { data } = response.data as BaseResponse<{ customer: any }>
    return Customer.from(data.customer)
  }
}
