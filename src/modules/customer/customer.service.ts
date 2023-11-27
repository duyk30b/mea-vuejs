import { AxiosInstance } from '@/core/axios.instance'
import { debounceAsync } from '@/utils/helpers'
import type { ApiPaginationResponse } from '../pagination'
import { CustomerListQuery, CustomerPaginationQuery } from './customer.dto'
import { Customer } from './customer.model'

export class CustomerService {
  static async pagination(options: CustomerPaginationQuery) {
    const params = CustomerPaginationQuery.plainFromPlain(options)

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
    const params = CustomerListQuery.plainFromPlain(options)

    const { data } = await AxiosInstance.get('/customer/list', { params })
    return Customer.fromPlains(data)
  }

  static search = debounceAsync(async (text: string): Promise<Customer[]> => {
    return CustomerService.list({
      limit: 10,
      filter: { searchText: text, isActive: true },
    })
  }, 200)

  static async detail(id: number): Promise<Customer> {
    const { data } = await AxiosInstance.get(`/customer/detail/${id}`)
    return Customer.fromPlain(data)
  }

  static async createOne(customer: Customer) {
    const customerDto = Customer.toPlain(customer)
    const { data } = await AxiosInstance.post('/customer/create', customerDto)

    return Customer.fromPlain(data)
  }

  static async updateOne(id: number, customer: Partial<Customer>) {
    const customerDto = Customer.toPlain(customer)
    const response = await AxiosInstance.patch(`/customer/update/${id}`, customerDto)

    return Customer.fromPlain(response.data)
  }
}
