import { defineStore } from 'pinia'
import { formatMoney } from '../../utils'

export enum ReceiptProcessType {
  NoDebt = 1,
  HasDebt = 2,
}

export enum InvoiceProcessType {
  NoDebt = 1,
  HasDebt = 2,
}

export const useScreenStore = defineStore('screen-store', {
  state: () => {
    return {
      // const isMobile = ref(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
      isMobile: window.innerWidth <= 768,

      SYSTEM_SETTING: {
        moneyDivisionFormat: 1,
        retailPrice: true,
        wholesalePrice: true,
        hasManageQuantity: true,
        hasManageBatches: false,
      },

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
      PRODUCT_ROUTE: <string[]>['Uống', 'Bôi', 'Ngậm', 'Tiêm', 'Xịt'],
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
      INVOICE_EXPENSE_DETAIL: <Record<string, string>>{
        _unknown: 'Khác',
        brokers: 'Hoa hồng',
        package: 'Đóng gói',
      },

      SCREEN_PRODUCT_LIST: {
        detail: true,
        substance: false,
        group: false,
        unit: true,
        costPrice: true,
        isActive: true,
        action: true,
      },
      SCREEN_PRODUCT_DETAIL: {},
      SCREEN_PRODUCT_UPSERT: {
        substance: false,
        unit: true,
        group: false,
        source: false,
        route: false,
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
          unit: true,
        },
        paymentInfo: {
          itemsActualMoney: true,
          discount: false,
          surcharge: false,
          paid: true,
          debt: true,
        },
        receiptProcessType: ReceiptProcessType.HasDebt,
        function: {
          forceEdit: false,
        },
      },
      SCREEN_RECEIPT_UPSERT: {
        receiptItemInput: {
          salePrice: true,
        },
        receiptItemsTable: {
          allowDuplicateItem: true,
          detail: false,
          substance: false,
          batch: false,
          unit: true,
        },
        distributor: {
          idDefault: 1,
        },
        paymentInfo: {
          itemsActualMoney: false,
          discount: false,
          surcharge: false,
        },
        save: {
          createBasicAndNew: false,
          createBasicAndDetail: false,
          createDraft: true,
        },
      },

      SCREEN_INVOICE_LIST: {},
      SCREEN_INVOICE_DETAIL: {
        invoiceItemsTable: {
          detail: false,
          substance: true,
          batch: false,
          hintUsage: false,
          unit: true,
          discount: true,
          expectedPrice: true,
        },
        paymentInfo: {
          itemsActualMoney: true,
          surcharge: false,
          discount: true,
          paid: true,
          debt: true,
        },
        invoiceProcessType: InvoiceProcessType.HasDebt,
        function: {
          forceEdit: false,
        },
      },
      SCREEN_INVOICE_PREVIEW: {
        invoiceItemsTable: {
          substance: false,
          batch: false,
          expiryDate: false,
          unit: true,
          expectedPrice: true,
          hintUsage: false,
        },
        paymentInfo: {
          itemsActualMoney: false,
          surcharge: false,
          discount: false,
        },
      },
      SCREEN_INVOICE_UPSERT: {
        invoiceItemInput: {
          negativeQuantity: false,
          customAfterSearch: true,
          hintUsage: false,
          expectedPrice: true,
          costPrice: true,
          quantity: true,
          discount: true,
          actualPrice: true,
        },
        invoiceItemsTable: {
          allowOverQuantity: false,
          allowDuplicateItem: true,
          detail: false,
          substance: true,
          unit: true,
          batch: false,
          hintUsage: false,
          discount: true,
          expectedPrice: false,
          editActualPrice: false,
        },
        customer: {
          idDefault: 1,
        },
        paymentInfo: {
          itemsActualMoney: true,
          discount: true,
          surcharge: false,
          expense: false,
          profit: false,
        },
        other: { expense: false },
        save: {
          createBasicAndNew: false,
          createBasicAndDetail: false,
          createDraft: true,
        },
      },
    }
  },

  actions: {},

  getters: {
    formatMoney: (state) => {
      return (money: number) => {
        if (state.SYSTEM_SETTING.moneyDivisionFormat === 1) {
          return formatMoney({ number: money, fixed: 0 })
        }
        if (state.SYSTEM_SETTING.moneyDivisionFormat === 1000) {
          return formatMoney({ number: money / state.SYSTEM_SETTING.moneyDivisionFormat, fixed: 3 })
        }
      }
    },
  },
})
