export type ConditionDate = {
  '>'?: Date | number | string
  'GT'?: Date | number | string
  '>='?: Date | number | string
  'GTE'?: Date | number | string
  '<'?: Date | number | string
  'LT'?: Date | number | string
  '<='?: Date | number | string
  'LTE'?: Date | number | string
  '=='?: Date | number | string
  'EQUAL'?: Date | number | string
  '!='?: Date | number | string
  'NOT'?: Date | number | string
  'IS_NULL'?: boolean
  'NOT_NULL'?: boolean
  'IN'?: Date[] | number[] | string[]
  'BETWEEN'?: [Date, Date] | [number, number] | [string, string]
}

export type ConditionNumber = {
  '>'?: number
  'GT'?: number
  '>='?: number
  'GTE'?: number
  '<'?: number
  'LT'?: number
  '<='?: number
  'LTE'?: number
  '=='?: number
  'EQUAL'?: number
  '!='?: number
  'NOT'?: number
  'IS_NULL'?: boolean
  'NOT_NULL'?: boolean
  'IN'?: number[]
  'BETWEEN'?: [number, number]
}

export type ConditionEnum<T> = {
  '=='?: T
  'EQUAL'?: T
  '!='?: T
  'NOT'?: T
  'IS_NULL'?: boolean
  'NOT_NULL'?: boolean
  'IN'?: T[]
  'BETWEEN'?: [T, T]
}

export class ConditionString {
  '=='?: string
  'EQUAL'?: string
  '!='?: string
  'NOT'?: string
  'IS_NULL'?: boolean
  'NOT_NULL'?: boolean
  'LIKE'?: string
  'IN'?: string[]
}
