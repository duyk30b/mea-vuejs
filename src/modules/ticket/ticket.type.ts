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
  RefundMoney = 7,
  RefundItem = 8,
  PayDebt = 9,
  RefundDebt = 10,
  Close = 11,
  Reopen = 12,
  Terminal = 13,
}

export const TicketActionTypeText = {
  [TicketActionType.TicketOrderDebtSuccessCreate]: 'Tạo phiếu nhanh',
  [TicketActionType.TicketOrderDebtSuccessUpdate]: 'Cập nhật phiếu nhanh',
  [TicketActionType.ShipProductAndPaymentAndClose]: 'Gửi hàng và thanh toán',
  [TicketActionType.PrePayment]: 'Tạm ứng',
  [TicketActionType.PaymentMoney]: 'Thanh toán',
  [TicketActionType.PaymentItem]: 'Thanh toán lẻ',
  [TicketActionType.RefundMoney]: 'Hoàn tiền',
  [TicketActionType.RefundItem]: 'Hoàn lẻ',
  [TicketActionType.PayDebt]: 'Trả nợ',
  [TicketActionType.RefundDebt]: 'Hoàn nợ',
  [TicketActionType.Close]: 'Đóng phiếu',
  [TicketActionType.Reopen]: 'Mở lại phiếu',
  [TicketActionType.Terminal]: 'Hủy phiếu',
}
