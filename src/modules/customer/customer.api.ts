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

  static async updateOne(id: number, customer: Customer) {
    const response = await AxiosInstance.patch(`/customer/update/${id}`, {
      fullName: customer.fullName,
      phone: customer.phone,
      birthday: customer.birthday || null,
      yearOfBirth: customer.yearOfBirth || null,
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

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/customer/destroy/${id}`)
    const result = response.data as BaseResponse<{ customerId: number; ticketList: Ticket[] }>
    result.data.ticketList = Ticket.fromList(result.data.ticketList)
    return result
  }

  static async downloadExcelCustomerList() {
    const response = await AxiosInstance.get(`/customer/download-excel`)
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    const uint8Array = new Uint8Array(data.buffer.data)
    const blob = new Blob([uint8Array], {
      type: data.mimeType,
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = data.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
}
