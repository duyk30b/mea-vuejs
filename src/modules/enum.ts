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

export enum VoucherType {
  Receipt = 1,
  Ticket = 2,
}

export enum DeliveryStatus {
  NoStock = 1, // không có hàng
  Pending = 2,
  Delivered = 3,
  // Returned = 4,
  // PartiallyReturned = 4,
  // FullyReturned = 5,
}

export enum PaymentViewType {
  Prepayment = 1,
  SendProductAndPaymentAndClose = 2,
  PayDebt = 3,
  RefundOverpaid = 4,
  Success = 5,
}

export enum AttributeInputType {
  InputText = 'InputText',
  InputNumber = 'InputNumber',
  InputDate = 'InputDate',
  Select = 'Select',
}

export enum AttributeLayoutType {
  Table = 'Bảng',
  InputAndLabelTop = 'Input và Nhãn bên trên',
  InputAndLabelLeft = 'Input và Nhãn bên trái',
}
