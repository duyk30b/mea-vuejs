export enum TicketStatus {
  Draft = 1,
  Schedule = 2,
  Executing = 3,
  Debt = 4,
  Completed = 5,
  Cancelled = 6,
}

export enum TicketActionType {
  TicketOrderDebtSuccessCreate = 1,
  TicketOrderDebtSuccessUpdate = 2,
  ShipProductAndPaymentAndClose = 3,
  PrePayment = 4,
  PaymentMoney = 5,
  PaymentItem = 6,
  DebitItem = 7,
  RefundMoney = 8,
  RefundItem = 9,
  PayDebt = 10,
  RefundDebt = 11,
  Close = 12,
  Reopen = 13,
  Terminal = 14,
}

export const TicketActionTypeText = {
  [TicketActionType.TicketOrderDebtSuccessCreate]: 'Tạo phiếu nhanh',
  [TicketActionType.TicketOrderDebtSuccessUpdate]: 'Cập nhật phiếu nhanh',
  [TicketActionType.ShipProductAndPaymentAndClose]: 'Gửi hàng và thanh toán',
  [TicketActionType.PrePayment]: 'Tạm ứng',
  [TicketActionType.PaymentMoney]: 'Thanh toán',
  [TicketActionType.PaymentItem]: 'Thanh toán',
  [TicketActionType.DebitItem]: 'Ghi nợ',
  [TicketActionType.RefundMoney]: 'Hoàn tiền',
  [TicketActionType.RefundItem]: 'Hoàn lẻ',
  [TicketActionType.PayDebt]: 'Trả nợ',
  [TicketActionType.RefundDebt]: 'Hủy nợ',
  [TicketActionType.Close]: 'Đóng phiếu',
  [TicketActionType.Reopen]: 'Mở lại phiếu',
  [TicketActionType.Terminal]: 'Hủy phiếu',
}
