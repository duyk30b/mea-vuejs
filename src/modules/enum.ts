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
  Prepayment = 1, // Thanh toán trước mua hàng
  ReceiveRefund = 2, // Nhận tiền hoàn trả
  Close = 3, // Đóng hồ sơ
  PayDebt = 4, // Trả nợ (thanh toán sau mua hàng )
  Reopen = 5, // Mở lại hồ sơ
}

export type UnitType = { name: string; rate: number; default?: boolean }

export enum MovementType {
  Receipt = 1,
  Invoice = 2,
  Visit = 3,
}

export enum VoucherType {
  Receipt = 1,
  Invoice = 2,
  Visit = 3,
}

export enum DeliveryStatus {
  OutOfStock = 0,
  Pending = 1,
  Delivered = 2,
  PartiallyReturned = 3,
  FullyReturned = 4,
}

export enum PaymentViewType {
  Prepayment = 1,
  SendProductAndPayment = 2,
  PayDebt = 3,
  RefundOverpaid = 4,
  Success = 5,
}
