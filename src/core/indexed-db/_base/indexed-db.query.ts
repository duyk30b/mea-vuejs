import { customFilter } from '../../../utils'

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
      if (['number', 'string', 'boolean', null].includes(typeof target)) {
        return record[column] === target
      }
      if (typeof target === 'function') {
        return target(record[column], record)
      }
      if (typeof target === 'object') {
        if (Object.keys(target).length === 0) return true
        return Object.entries(target).every(([rule, value]: [string, any]) => {
          if (value === undefined) return true
          if (rule === '>' || rule === 'GT') {
            return record[column] > value
          }
          if (rule === '>=' || rule === 'GTE') {
            return record[column] >= value
          }
          if (rule === '<=' || rule === 'LTE') {
            return record[column] <= value
          }
          if (rule === '<' || rule === 'LT') {
            return record[column] < value
          }
          if (rule === '==' || rule === 'EQUAL') {
            return record[column] === value
          }
          if (rule === '!=' || rule === 'NOT') {
            return record[column] != value
          }
          if (rule === 'IS_NULL') {
            if (value === true) return record[column] == null
            if (value === false) return record[column] != null
          }
          if (rule === 'NOT_NULL') {
            if (value === true) return record[column] != null
            if (value === false) return record[column] == null
          }
          if (rule === 'BETWEEN') {
            return value[0] <= record[column] && record[column] <= record[1]
          }
          if (rule === 'IN') {
            if (value.length === 0) return record[column] == null
            return value.includes(record[column])
          }
          if (rule === 'LIKE') {
            return customFilter(record[column] || '', value, 2)
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
        if (value === 'ASC') {
          if (b[key] == null)
            return -1 // tăng hay giảm thì cũng để NULL ở cuối
          else if (a[key] == null) return 1
          else return a[key] < b[key] ? -1 : 1
        }
        if (value === 'DESC') {
          if (b[key] == null)
            return -1 // tăng hay giảm thì cũng để NULL ở cuối
          else if (a[key] == null) return 1
          else return a[key] > b[key] ? -1 : 1
        }
        if (typeof value === 'function') {
          return value(a, b)
        }
        // if (value === 'ASC') return a[key] < b[key] ? -1 : 1
        // if (value === 'DESC') return a[key] > b[key] ? -1 : 1
        return a.id > b.id ? -1 : 1
      })
    })
    return recordResult
  }
}
