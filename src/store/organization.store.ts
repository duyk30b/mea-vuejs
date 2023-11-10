import { defineStore } from 'pinia'
import { Organization } from '../modules/organization/organization.model'
import { formatNumber } from '@/utils'

export const useOrganizationStore = defineStore('organization-store', {
	state: () => {
		return {
			// const isMobile = ref(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
			isMobile: window.innerWidth <= 768,
			organizationInfo: Organization.blank(),

			SYSTEM_SETTING: { moneyDivisionFormat: 1 },

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
			PRODUCT_HINT_USAGE: <string[]>[
				'Uống 2 lần/ngày sau ăn, sáng 1 viên, chiều 1 viên',
				'Uống 1 viên khi sốt, sau 4h có thể uống tiếp',
				'Bôi dưới da 3 lần/ngày',
			],

			PROCEDURE_GROUP: <Record<string, string>>{
				1: 'Tiêm truyền',
				2: 'Làm đẹp',
				3: 'Chăm sóc',
			},

			INVOICE_SURCHARGE_DETAIL: <Record<string, string>>{
				_unknown: 'Khác',
				shipCost: 'Tiền vận chuyển',
				advisory: 'Phí tư vấn',
			},
			INVOICE_EXPENSES_DETAIL: <Record<string, string>>{
				_unknown: 'Khác',
				brokers: 'Hoa hồng',
				package: 'Đóng gói',
			},

			SCREEN_PRODUCT_LIST: {
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
			SCREEN_PRODUCT_DETAIL: {},
			SCREEN_PRODUCT_UPSERT: {
				substance: true,
				group: true,
				unit: true,
				source: true,
				route: true,
				hintUsage: true,
			},

			SCREEN_PROCEDURE_LIST: {
				table: { detail: true, group: true, status: true, action: true },
				upsert: {},
			},
			SCREEN_PROCEDURE_DETAIL: {},
			SCREEN_PROCEDURE_UPSERT: {},

			SCREEN_DISTRIBUTOR_LIST: {
				detail: true,
				phone: true,
				address: true,
				note: true,
				isActive: true,
				action: true,
			},
			SCREEN_DISTRIBUTOR_DETAIL: {},
			SCREEN_DISTRIBUTOR_UPSERT: {
				phone: true,
				address: true,
			},

			SCREEN_CUSTOMER_LIST: {
				detail: true,
				phone: true,
				gender: true,
				birthday: true,
				address: true,
				note: true,
				isActive: true,
				action: true,
			},
			SCREEN_CUSTOMER_DETAIL: {},
			SCREEN_CUSTOMER_UPSERT: {
				phone: true,
				birthday: true,
				gender: true,
				identityCard: true,
				address: true,
				relative: true,
			},

			SCREEN_RECEIPT_LIST: {},
			SCREEN_RECEIPT_DETAIL: {
				receiptItemsTable: {
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
					paid: true,
					debt: true,
				},
				receiptProcessType: 1,
			},
			SCREEN_RECEIPT_UPSERT: {
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

			SCREEN_INVOICE_LIST: {},
			SCREEN_INVOICE_DETAIL: {
				invoiceItemsTable: {
					detail: true,
					substance: true,
					batch: true,
					expiryDate: true,
					hintUsage: false,
					unit: true,
					discount: true,
					expectedPrice: true,
				},
				paymentInfo: {
					totalItemMoney: true,
					surcharge: true,
					discount: true,
					paid: true,
					debt: true,
				},
				invoiceProcessType: 2,
			},
			SCREEN_INVOICE_PREVIEW: {
				invoiceItemsTable: {
					substance: true,
					batch: true,
					expiryDate: true,
					unit: true,
					expectedPrice: true,
					hintUsage: true,
				},
				paymentInfo: {
					totalItemMoney: true,
					surcharge: true,
					discount: true,
				},
			},
			SCREEN_INVOICE_UPSERT: {
				invoiceItemInput: {
					quantity: true,
					expectedPrice: true,
					costPrice: false,
					wholesalePrice: true,
					retailPrice: true,
					discount: true,
					actualPrice: true,
					hintUsage: true,
				},
				invoiceItemsTable: {
					detail: true,
					substance: true,
					batch: true,
					expiryDate: true,
					hintUsage: false,
					unit: true,
					expectedPrice: true,
					discount: true,
				},
				paymentInfo: {
					discount: true,
					surcharge: true,
				},
				other: { expenses: true },
			},
		}
	},
	getters: {
		formatMoney: (state) => {
			return (money: number) => {
				return formatNumber(money / state.SYSTEM_SETTING.moneyDivisionFormat)
			}
		},
	},
})
