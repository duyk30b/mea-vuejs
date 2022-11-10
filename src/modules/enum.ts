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

export enum DebtType {
	Borrow = 1,
	PayUp = 2,
	Refund = 3,
}

export enum PaymentStatus {
	Unknown = 0,
	Unpaid = 1,
	Partial = 2,
	Full = 3,
	Refund = 4,
}

export const PaymentStatusText = {
	[PaymentStatus.Unknown]: 'Không xác định',
	[PaymentStatus.Unpaid]: 'Nháp',
	[PaymentStatus.Partial]: 'Thanh toán một phần',
	[PaymentStatus.Full]: 'Đã thanh toán',
	[PaymentStatus.Refund]: 'Hoàn trả',
}

export enum InvoiceItemType {
	ProductBatch = 1,
	Procedure = 2,
}

export enum ProductMovementType {
	Receipt = 1,
	Invoice = 2,
}

export enum ArrivalType {
	Invoice = 1,
	Normal = 2,
}

export enum ArrivalStatus {
	Unknown = 0,
	Waiting = 1,
	Examining = 2,
	Paying = 3,
	Finish = 4,
}
