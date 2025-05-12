import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Ticket } from '../ticket'
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
      facebook: customer.facebook || '',
      zalo: customer.zalo || '',
      birthday: customer.birthday,
      yearOfBirth: customer.yearOfBirth,
      gender: customer.gender,
      addressProvince: customer.addressProvince,
      addressDistrict: customer.addressDistrict,
      addressWard: customer.addressWard,
      addressStreet: customer.addressStreet,
      relative: customer.relative, // người thân
      healthHistory: customer.healthHistory, // Tiền sử bệnh
      note: customer.note,
      customerSourceId: customer.customerSourceId || 0,
      isActive: customer.isActive, // Trạng thái
    })
    const { data } = response.data as BaseResponse<{ customer: any }>
    return Customer.from(data.customer)
  }

  static async updateOne(id: number, customer: Partial<Customer>) {
    const response = await AxiosInstance.patch(`/customer/update/${id}`, {
      fullName: customer.fullName !== undefined ? customer.fullName : undefined,
      phone: customer.phone !== undefined ? customer.phone : undefined,
      facebook: customer.facebook !== undefined ? customer.facebook : undefined,
      zalo: customer.zalo !== undefined ? customer.zalo : undefined,
      birthday: customer.birthday !== undefined ? customer.birthday || null : undefined,
      yearOfBirth: customer.yearOfBirth !== undefined ? customer.yearOfBirth || null : undefined,
      gender: customer.gender !== undefined ? customer.gender : undefined,
      addressProvince:
        customer.addressProvince !== undefined ? customer.addressProvince : undefined,
      addressDistrict:
        customer.addressDistrict !== undefined ? customer.addressDistrict : undefined,
      addressWard: customer.addressWard !== undefined ? customer.addressWard : undefined,
      addressStreet: customer.addressStreet !== undefined ? customer.addressStreet : undefined,
      relative: customer.relative !== undefined ? customer.relative : undefined, // người thân
      healthHistory: customer.healthHistory !== undefined ? customer.healthHistory : undefined, // Tiền sử bệnh
      note: customer.note !== undefined ? customer.note : undefined,
      customerSourceId:
        customer.customerSourceId !== undefined ? customer.customerSourceId || 0 : undefined,
      isActive: customer.isActive !== undefined ? customer.isActive : undefined, // Trạng thái
    })
    const { data } = response.data as BaseResponse<{ customer: any }>
    return Customer.from(data.customer)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/customer/destroy/${id}`)
    const result = response.data as BaseResponse<{ customerId: number; ticketList: Ticket[] }>
    result.data.ticketList = Ticket.fromList(result.data.ticketList)
    return result
  }
}
