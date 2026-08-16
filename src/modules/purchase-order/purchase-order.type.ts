export enum PurchaseOrderStatus {
  Draft = 1,
  Schedule = 2,
  Executing = 3,
  Debt = 4,
  Completed = 5,
  Cancelled = 6,
}

export const PurchaseOrderStatusText = {
  [PurchaseOrderStatus.Draft]: 'Nháp',
  [PurchaseOrderStatus.Schedule]: 'Đã đặt cọc',
  [PurchaseOrderStatus.Executing]: 'Đang thực hiện',
  [PurchaseOrderStatus.Debt]: 'Nợ',
  [PurchaseOrderStatus.Completed]: 'Hoàn thành',
  [PurchaseOrderStatus.Cancelled]: 'Hủy',
}

export enum PurchaseOrderActionType {
  PurchaseOrderDebtSuccessCreate = 1,
  PurchaseOrderDebtSuccessUpdate = 2,
  ReceiveProductAndPaymentAndClose = 3,
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

export const PurchaseOrderActionTypeText = {
  [PurchaseOrderActionType.PurchaseOrderDebtSuccessCreate]: 'Tạo phiếu nhanh',
  [PurchaseOrderActionType.PurchaseOrderDebtSuccessUpdate]: 'Cập nhật phiếu nhanh',
  [PurchaseOrderActionType.ReceiveProductAndPaymentAndClose]: 'Gửi hàng và thanh toán',
  [PurchaseOrderActionType.PrePayment]: 'Tạm ứng',
  [PurchaseOrderActionType.PaymentMoney]: 'Thanh toán',
  [PurchaseOrderActionType.PaymentItem]: 'Thanh toán lẻ',
  [PurchaseOrderActionType.RefundMoney]: 'Hoàn tiền',
  [PurchaseOrderActionType.RefundItem]: 'Hoàn lẻ',
  [PurchaseOrderActionType.PayDebt]: 'Trả nợ',
  [PurchaseOrderActionType.RefundDebt]: 'Hoàn nợ',
  [PurchaseOrderActionType.Close]: 'Đóng phiếu',
  [PurchaseOrderActionType.Reopen]: 'Mở lại phiếu',
  [PurchaseOrderActionType.Terminal]: 'Hủy phiếu',
}
