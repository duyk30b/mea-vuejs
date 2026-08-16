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

export enum PickupStrategy {
  Inherit = 0, // Dùng theo cấu hình mặc định hệ thống
  NoImpact = 1, // Không tác động đến kho
  RequireBatchSelection = 2, // Bắt buộc chọn lô
  AutoWithFIFO = 3, // Auto theo FIFO
  AutoWithExpiryDate = 4, // Auto ưu tiên hạn gần
}

export enum DeliveryStatus {
  Empty = 1, // không có hàng trong phiếu, không thể giao hàng
  Pending = 2,
  Partial = 3,
  Delivered = 4,
  Cancelled = 5,
}

export const DeliveryStatusText = {
  [DeliveryStatus.Empty]: 'Không có hàng',
  [DeliveryStatus.Pending]: 'Chưa gửi hàng',
  [DeliveryStatus.Partial]: 'Gửi hàng một phần',
  [DeliveryStatus.Delivered]: 'Đã gửi hàng',
  [DeliveryStatus.Cancelled]: 'Đã hủy',
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

export enum TicketItemPaymentType {
  NoEffect = -1, // không cần thanh toán, không cộng tiền (trường hợp vật tư tiêu hao của dịch vụ)
  TicketPaid = 1,
  PendingPayment = 2,
  PartialPaid = 3,
  FullPaid = 4,
  Debt = 5,
}

