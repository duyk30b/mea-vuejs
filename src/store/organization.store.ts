import { defineStore } from 'pinia'
import { Organization } from '../modules/organization/organization.model'

export const useOrganizationStore = defineStore('organization-store', {
	state: () => {
		return {
			organizationInfo: Organization.blank(),
			arrivalSettingStore: { examinationFee: 0 },
			PRODUCT_GROUP: <Record<string, string>>{
				1: 'Kháng sinh - Kháng Virus',
				2: 'Dị ứng',
				3: 'Thần Kinh',
				4: 'Tiêu Hóa',
				5: 'Cơ Xương Khớp',
				6: 'Giảm Đau - Hạ Sốt',
				8: 'Thực Phẩm Chức Năng',
				9: 'Dinh Dưỡng',
				10: 'Hô hấp',
				11: 'Tim Mạch',
				12: 'Da Liễu',
			},
			PRODUCT_UNIT: <string[]>[
				'Lọ',
				'Vỉ',
				'Viên',
				'Gói',
				'Tuýp',
				'Túi',
				'Chai',
				'Ống',
				'Chiếc',
				'Cái',
				'Hộp',
			],
			PRODUCT_ROUTE: <string[]>[
				'Uống',
				'Bôi',
				'Ngậm',
				'Tiêm',
				'Xịt',
			],
			PROCEDURE_GROUP: <Record<string, string>>{
				1: 'Tiêm truyền',
				2: 'Làm đẹp',
				3: 'Chăm sóc',
			},

			SCREEN_PRODUCT_LIST: {
				table: {
					detail: true,
					substance: true,
					group: true,
					unit: true,
					batch: true,
					expiryDate: true,
					costPrice: true,
					wholesalePrice: true,
					retailPrice: true,
					isActive: true,
					action: true,
				},
				upsert: {
					substance: true,
					group: true,
					unit: true,
					source: true,
					route: true,
					hintUsage: true,
				},
			},
			SCREEN_PURCHASE_RECEIPT_LIST: {},
			SCREEN_PURCHASE_RECEIPT_DETAIL: {
				receiptItem: {
					substance: true,
					detail: true,
					batch: true,
					expiryDate: true,
					unit: true,
				},
				paymentInfo: {
					totalItemMoney: true,
					discount: true,
					surcharge: true,
					payment: true,
					debt: true,
				},
			},

			SCREEN_PURCHASE_RECEIPT_UPSERT: {
				receiptItemInput: {
					batch: true,
					expectedPrice: true,
					retailPrice: true,
					wholesalePrice: true,
				},
				receiptItemsTable: {
					substance: true,
					detail: true,
					batch: true,
					expiryDate: true,
					unit: true,
				},
				paymentInfo: {
					totalActualMoney: true,
					discount: true,
					surcharge: true,
				},
				other: { expenses: true },
			},

			SCREEN_INVOICE_ARRIVAL_LIST: {},
			SCREEN_INVOICE_ARRIVAL_DETAIL: {
				invoiceItems: {
					detail: true,
					substance: true,
					expiryDate: false,
					unit: true,
					discount: true,
					expectedPrice: true,
				},
				paymentInfo: {
					totalItemMoney: true,
					surcharge: true,
					discount: true,
					payment: true,
					debt: true,
				},
			},

			SCREEN_INVOICE_ARRIVAL_UPSERT: {
				invoiceItemInput: {
					quantity: true,
					expectedPrice: true,
					costPrice: false,
					wholesalePrice: true,
					retailPrice: true,
					discount: true,
					actualPrice: true,
				},
				invoiceItemsTable: {
					substance: true,
					expiryDate: true,
					unit: true,
					discount: true,
				},
				paymentInfo: { discount: true, surcharge: true },
				other: { expenses: true },
			},

			SCREEN_CUSTOMER_LIST: {
				table: {
					detail: true,
					phone: true,
					gender: true,
					birthday: true,
					address: true,
					note: true,
					isActive: true,
					action: true,
				},
				upsert: { address: true },
			},
			SCREEN_CUSTOMER_DETAIL: {},

			SCREEN_DISTRIBUTOR_LIST: {
				table: {
					detail: true,
					phone: true,
					address: true,
					note: true,
					isActive: true,
					action: true,
				},
				upsert: { address: true },
			},
			SCREEN_DISTRIBUTOR_DETAIL: {},

			SCREEN_PROCEDURE_LIST: {
				table: { detail: true, group: true, status: true, action: true },
				upsert: {},
			},
			SCREEN_PROCEDURE_DETAIL: {},
		}
	},
})
