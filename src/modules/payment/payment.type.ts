export enum PaymentPersonType {
  Other = 0,
  Distributor = 1,
  Customer = 2,
  Employee = 3,
}

export enum PaymentActionType {
  PaymentMoney = 1, // Thanh toán
  RefundMoney = 2, // Hoàn tiền
  Debit = 3, // Ghi nợ
  PayDebt = 4, // Trả nợ
  RefundDebt = 5, // Hủy nợ
  FixCustomerByExcel = 6, // Sửa customer bằng excel
  FixWallet = 7, // Sửa ví
  UserCreate = 8, // Tạo phiếu thanh toán
}

export const PaymentActionTypeText = {
  [PaymentActionType.PaymentMoney]: 'Thanh toán',
  [PaymentActionType.RefundMoney]: 'Hoàn tiền',
  [PaymentActionType.Debit]: 'Ghi nợ',
  [PaymentActionType.RefundDebt]: 'Hủy nợ',
  [PaymentActionType.PayDebt]: 'Trả nợ',
  [PaymentActionType.FixCustomerByExcel]: 'Sửa KH bằng excel',
  [PaymentActionType.FixWallet]: 'Sửa ví',
  [PaymentActionType.UserCreate]: 'Tạo phiếu thanh toán',
}

export enum MoneyDirection {
  Other = 0,
  In = 1,
  Out = 2,
}
