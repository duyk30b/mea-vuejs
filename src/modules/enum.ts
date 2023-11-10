export enum EGender {
	Female = 0,
	Male = 1,
}

export enum ERole {
	Root = 0,
	Admin = 1,
	User = 2
}

export enum DiscountType {
	Percent = '%',
	VND = 'VNĐ',
}

export enum PaymentType {
	ReceiveRefund = -1,       // Nhận tiền hoàn trả
	Prepayment = 0,           // Thanh toán trước mua hàng
	ImmediatePayment = 1,     // Thanh toán ngay khi mua hàng 
	PayDebt = 2,              // Trả nợ (thanh toán sau mua hàng )
}

export type SurchargeDetailType = {
	key: '_unknown' | string,
	name: string,
	money: number
}

export type ExpensesDetailType = {
	key: '_unknown' | string,
	name: string,
	money: number
}
