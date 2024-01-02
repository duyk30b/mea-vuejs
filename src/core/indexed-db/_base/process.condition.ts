import type { BaseIndexedDB } from './_base.indexed-db'

export type ConditionAnd<T> = {
  [P in keyof T]?:
    | T[P]
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
      })[]
}
export type BaseCondition<T> = ConditionAnd<T> | ConditionAnd<T>[]

export class ProcessCondition<T> {
  handleRuleTargetAnd(record: any, column: string, target: Record<string, any>) {
    return Object.entries(target).every(([rule, value]: [string, any]) => {
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
    })
  }

  handleConditionAnd(record: any, conditions: ConditionAnd<T> = {}) {
    return Object.entries(conditions).every(([column, target]: [string, any]) => {
      if (['number', 'string', 'boolean', null].includes(typeof target)) {
        return record[column] === target
      }
      if (typeof target === 'object') {
        if (Object.keys(target).length === 0) return
        if (Array.isArray(target)) {
          return target.some((t) => this.handleRuleTargetAnd(record, column, t))
        }
        if (typeof target === 'object') {
          return this.handleRuleTargetAnd(record, column, target)
        }
      }
    })
  }

  processCondition(record: any, conditions: BaseCondition<T> = {}) {
    if (Array.isArray(conditions)) {
      return conditions.some((c) => this.handleConditionAnd(record, c))
    }
    return this.handleConditionAnd(conditions)
  }
}
