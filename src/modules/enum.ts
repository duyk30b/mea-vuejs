// export type ComparisonType = 'LIKE' | 'EQUAL' | 'BETWEEN' | 'IS_NULL' | 'NOT_NULL' | '>' | '<'
export const ComparisonType = [
  'LIKE',
  'BETWEEN',
  'IS_NULL',
  'NOT_NULL',
  '>',
  '<',
  '>=',
  '<=',
  '==',
  '!=',
] as const
export type ComparisonType = (typeof ComparisonType)[number]

export const UNKNOWN_KEY = '_unknown'

export enum EGender {
  Female = 0,
  Male = 1,
}

export enum ERole {
  Root = 0,
  Admin = 1,
  User = 2,
}

export enum DiscountType {
  Percent = '%',
  VND = 'VNĐ',
}

export enum PaymentType {
  ReceiveRefund = -1, // Nhận tiền hoàn trả
  Prepayment = 0, // Thanh toán trước mua hàng
  ImmediatePayment = 1, // Thanh toán ngay khi mua hàng
  PayDebt = 2, // Trả nợ (thanh toán sau mua hàng )
}

export type UnitType = { name: string; rate: number; default?: boolean }

export enum MovementType {
  Receipt = 1,
  Invoice = 2,
}
