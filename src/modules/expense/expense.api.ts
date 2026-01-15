import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
    ExpenseDetailQuery,
    ExpenseGetQuery,
    type ExpenseListQuery,
    type ExpensePaginationQuery,
} from './expense.dto'
import { Expense } from './expense.model'

export class ExpenseApi {
  static async pagination(options: ExpensePaginationQuery) {
    const params = ExpenseGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/expense/pagination', { params })
    const { data, meta } = response.data as FullResponse
  }

  static async list(options: ExpenseListQuery) {
    const params = ExpenseGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/expense/list', { params })
    const { data, time } = response.data as FullResponse<{ expenseList: any[] }>
    return Expense.fromList(data.expenseList)
  }

  static async detail(id: number, options: ExpenseDetailQuery = {}): Promise<Expense> {
    const params = ExpenseGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/expense/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse<{ expense: any }>
    return Expense.from(data.expense)
  }

  static async createOne(expense: Expense) {
    const response = await AxiosInstance.post('/expense/create', {
      code: expense.code,
      name: expense.name,
      isActive: expense.isActive,
    })
    const { data } = response.data as FullResponse<{ expense: any }>
    return Expense.from(data.expense)
  }

  static async updateOne(id: number, expense: Partial<Expense>) {
    const response = await AxiosInstance.post(`/expense/update/${id}`, {
      code: expense.code,
      name: expense.name,
      isActive: expense.isActive,
    })
    const { data } = response.data as FullResponse<{ expense: any }>
    return Expense.from(data.expense)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/expense/destroy/${id}`)
    const result = response.data as FullResponse<{ expenseId: number }>
    return result
  }
}
