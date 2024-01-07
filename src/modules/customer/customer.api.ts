import { AxiosInstance } from '@/core/axios.instance'
import { debounceAsync } from '@/utils/helpers'
import type { ApiPaginationResponse } from '../pagination'
import { CustomerGetQuery, CustomerListQuery, CustomerPaginationQuery } from './customer.dto'
import { Customer } from './customer.model'

export class CustomerApi {
  static async pagination(options: CustomerPaginationQuery) {
    const params = CustomerGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Customer.fromPlains(data.data),
    }
  }

  static async list(options: CustomerListQuery): Promise<Customer[]> {
    const params = CustomerGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get('/customer/list', { params })
    return Customer.fromPlains(data)
  }

  static search = debounceAsync(async (text: string): Promise<Customer[]> => {
    return await CustomerApi.list({
      limit: 10,
      filter: { searchText: text, isActive: 1 },
    })
  }, 200)

  static async detail(id: number): Promise<Customer> {
    const { data } = await AxiosInstance.get(`/customer/detail/${id}`)
    return Customer.fromPlain(data)
  }

  static async createOne(customer: Customer) {
    const customerDto = Customer.toPlain(customer, 'CREATE')
    const { data } = await AxiosInstance.post('/customer/create', customerDto)

    return Customer.fromPlain(data)
  }

  static async updateOne(id: number, customer: Partial<Customer>) {
    const customerDto = Customer.toPlain(customer, 'UPDATE')
    const response = await AxiosInstance.patch(`/customer/update/${id}`, customerDto)

    return Customer.fromPlain(response.data)
  }

  static async deleteOne(id: number) {
    const { data } = await AxiosInstance.delete(`/customer/delete/${id}`)
    return data as { success: boolean }
  }
}
