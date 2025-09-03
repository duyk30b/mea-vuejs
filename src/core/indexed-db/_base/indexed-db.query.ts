import { customFilter, ESObject } from '../../../utils'

export type BaseCondition<T> = {
  [P in keyof T]?:
    | T[P]
    | ((value: any) => boolean)
    | ({
        [Q in
          | '>'
          | 'GT'
          | '>='
          | 'GTE'
          | '<'
          | 'LT'
          | '<='
          | 'LTE'
          | '=='
          | 'EQUAL'
          | '!='
          | 'NOT']?: T[P]
      } & {
        [Q in 'IS_NULL' | 'NOT_NULL']?: boolean
      } & {
        LIKE?: string
        IN?: T[P][]
        NOT_IN?: T[P][]
        BETWEEN?: [T[P], T[P]]
        RAW_QUERY?: string
      })
} & { $OR?: BaseCondition<T>[] } & { $AND?: BaseCondition<T>[] }

export type BaseSort<T> = {
  [P in keyof T]?: 'ASC' | 'DESC' | ((value: any) => 1 | -1)
}

let index = 0

export class IndexedDBQuery<T> {
  executeFilter(record: any, condition: BaseCondition<T>): boolean {
    return Object.entries(condition).every(([column, target]: [string, any]) => {
      if (target === undefined) return true
      if (column === '$OR') {
        return target.some((t: any) => this.executeFilter(record, t))
      }
      if (column === '$AND') {
        return target.every((t: any) => this.executeFilter(record, t))
      }

      const recordValue = ESObject.getNestedValue(record, column) // để xử lý trường hợp "batch.product.brandName"
      if (['number', 'string', 'boolean', null].includes(typeof target)) {
        return recordValue === target
      }
      if (typeof target === 'function') {
        return target(recordValue, record)
      }
      if (typeof target === 'object') {
        if (Object.keys(target).length === 0) return true
        return Object.entries(target).every(([operator, expected]: [string, any]) => {
          if (expected === undefined) return true

          switch (operator) {
            case '>':
            case 'GT':
              return recordValue > expected
            case '>=':
            case 'GTE':
              return recordValue >= expected
            case '<=':
            case 'LTE':
              return recordValue <= expected
            case '<':
            case 'LT':
              return recordValue < expected
            case '==':
            case 'EQUAL':
              return recordValue === expected
            case '!=':
            case 'NOT':
              return recordValue != expected
            case 'IS_NULL':
              return expected ? recordValue == null : recordValue != null
            case 'NOT_NULL':
              return expected ? recordValue != null : recordValue == null
            case 'BETWEEN':
              return expected[0] <= recordValue && recordValue <= expected[1]
            case 'IN':
              if (!expected || expected.length === 0) return recordValue == null
              return expected.includes(recordValue)
            case 'NOT_IN':
              if (!expected || expected.length === 0) return recordValue != null
              return !expected.includes(recordValue)
            case 'LIKE':
              return customFilter(recordValue || '', expected, 2)
            default:
              return false
          }
        })
      }
      return false
    })
  }

  executeSort(recordList: any[], sort: BaseSort<T>) {
    const recordResult = [...recordList]
    Object.entries(sort).forEach(([key, value]) => {
      if (!key || !value) return
      recordResult.sort((a: any, b: any) => {
        const aValue = ESObject.getNestedValue(a, key)
        const bValue = ESObject.getNestedValue(b, key)

        if (value === 'ASC') {
          if (bValue == null)
            return -1 // tăng hay giảm thì cũng để NULL ở cuối
          else if (aValue == null) return 1
          else return aValue < bValue ? -1 : 1
        }
        if (value === 'DESC') {
          if (bValue == null)
            return -1 // tăng hay giảm thì cũng để NULL ở cuối
          else if (aValue == null) return 1
          else return aValue > bValue ? -1 : 1
        }
        if (typeof value === 'function') {
          return value(a, b)
        }
        // if (value === 'ASC') return aValue < bValue ? -1 : 1
        // if (value === 'DESC') return aValue > bValue ? -1 : 1
        return a.id > b.id ? -1 : 1
      })
    })
    return recordResult
  }
}
