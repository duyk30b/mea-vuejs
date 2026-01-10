import { CollectionQuery } from '@/core/indexed-db/common/collection.query'
import { ref } from 'vue'
import { ESArray, ESString } from '../../utils'
import { ExpenseApi } from './expense.api'
import type { ExpenseDetailQuery, ExpenseListQuery, ExpensePaginationQuery } from './expense.dto'
import { Expense } from './expense.model'

const ExpenseDBQuery = new CollectionQuery<Expense>()

export class ExpenseService {
  static loadedAll: boolean = false

  static expenseAll = ref<Expense[]>([])
  static expenseMap = ref<Record<string, Expense>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const expenseAll = await ExpenseApi.list({ sort: { id: 'ASC' } })
        ExpenseService.expenseAll.value = expenseAll
        ExpenseService.expenseMap.value = ESArray.arrayToKeyValue(expenseAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ payment-method.service.ts:21 ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !ExpenseService.loadedAll || options.refetch) {
        ExpenseService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: Expense[], query: ExpensePaginationQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return ExpenseDBQuery.executeFilter(i, filter)
      })
    }
    if (query.sort) {
      data = ExpenseDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async pagination(query: ExpensePaginationQuery) {
    const page = query.page || 1
    const limit = query.limit || 10
    await ExpenseService.fetchAll()
    const dataQuery = ExpenseService.executeQuery(ExpenseService.expenseAll.value, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      expenseList: data,
      total: dataQuery.length,
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await ExpenseService.fetchAll({ refetch: !!options?.refetch })
    return ExpenseService.expenseMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await ExpenseService.fetchAll({ refetch: !!options?.refetch })
    return ExpenseService.expenseAll.value
  }

  static async list(query: ExpenseListQuery) {
    await ExpenseService.fetchAll()
    const data = ExpenseService.executeQuery(ExpenseService.expenseAll.value, query)

    return Expense.fromList(data)
  }

  static async detail(id: number, options: ExpenseDetailQuery = {}) {
    const expense = await ExpenseApi.detail(id, options)
    if (expense) {
      const findIndex = ExpenseService.expenseAll.value.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        ExpenseService.expenseAll.value[findIndex] = expense
      }
    }
    return expense
  }

  static async createOne(expense: Expense, options?: {}) {
    const result = await ExpenseApi.createOne(expense)
    ExpenseService.loadedAll = false
    return result
  }

  static async updateOne(id: number, expense: Partial<Expense>, options?: {}) {
    const result = await ExpenseApi.updateOne(id, expense)
    ExpenseService.loadedAll = false
    return result
  }

  static async destroyOne(id: number, options?: {}) {
    const result = await ExpenseApi.destroyOne(id)
    ExpenseService.loadedAll = false
    return result
  }

  static async search(text: string) {
    if (!text) text = ''
    return ExpenseService.expenseAll.value.filter((i) => {
      return ESString.customFilter(i.name, text)
    })
  }
}
