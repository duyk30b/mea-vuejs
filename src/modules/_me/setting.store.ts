import { defineStore } from 'pinia'
import { formatNumber } from '../../utils'
import { TicketStatus, TicketType } from '../ticket'

export const settingDefault = {
  isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 900,
  // isMobile: window.innerWidth <= 768,
  GOOGLE_DRIVER: { email: '' },
  SYSTEM_SETTING: {
    moneyDivisionFormat: 1,
    retailPrice: true,
    wholesalePrice: false,
    allowNegativeQuantity: false,
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
    substance: true,
    group: true,
    lotNumber: false,
    expiryDate: true,
    unit: true,
    costPrice: true,
    isActive: true,
    action: true,
  },
  SCREEN_PRODUCT_DETAIL: {},
  SCREEN_PRODUCT_UPSERT: {
    substance: true,
    lotNumber: true,
    expiryDate: true,
    unit: true,
    group: true,
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

  SCREEN_LABORATORY_LIST: {},
  SCREEN_RADIOLOGY_LIST: {
    SORT: {},
  },

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
    birthday: true,
    gender: true,
    addressFull: false,
    addressBasic: true,
    relative: false,
    note: false,
    customerSource: false,
  },

  SCREEN_RECEIPT_LIST: {
    receiptItems: false,
  },
  SCREEN_RECEIPT_DETAIL: {
    receiptItemsTable: {
      substance: true,
      detail: true,
      lotNumberAndExpiryDate: true,
      unit: true,
    },
    paymentInfo: {
      itemsActualMoney: true,
      discount: true,
      surcharge: true,
      paid: true,
      debt: true,
    },
    process: {
      sendProductAndPayment: true,
      sendProductAndDebit: false,
    },
  },
  SCREEN_RECEIPT_UPSERT: {
    receiptItemsTable: {
      allowDuplicateItem: true,
      detail: true,
      substance: true,
      lotNumberAndExpiryDate: true,
      unit: true,
    },
    distributor: {
      idDefault: 0,
    },
    paymentInfo: {
      itemsActualMoney: true,
      discount: true,
      surcharge: true,
      paid: false,
      debt: false,
    },
    save: {
      createDraft: true,
    },
  },

  SCREEN_TICKET_ORDER_LIST: {
    profit: true,
    ticketProductList: false,
    ticketAttributeList: false,
  },
  SCREEN_INVOICE_DETAIL: {
    invoiceItemsTable: {
      detail: true,
      substance: true,
      lotNumberAndExpiryDate: true,
      hintUsage: true,
      unit: true,
      discount: true,
      expectedPrice: true,
    },
    paymentInfo: {
      itemsActualMoney: true,
      discount: true,
      surcharge: true,
      totalCostAmount: true,
      expense: true,
      profit: true,
      paid: true,
      debt: true,
    },
    process: {
      forceEdit: false,
    },
  },
  SCREEN_INVOICE_PREVIEW: {
    invoiceItemsTable: {
      substance: true,
      batch: false,
      expiryDate: false,
      unit: true,
      expectedPrice: true,
      hintUsage: true,
    },
    paymentInfo: {
      itemsActualMoney: true,
      surcharge: true,
      discount: true,
      paid: false,
      debt: false,
    },
  },
  SCREEN_INVOICE_UPSERT: {
    invoiceItemInput: {
      customAfterSearch: true,
      hintUsage: false,
      expectedPrice: true,
      costPrice: true,
      costPriceAverage: true,
      quantity: true,
      discount: true,
      actualPrice: true,
    },
    invoiceItemsTable: {
      allowOverQuantity: false,
      allowDuplicateItem: true,
      detail: true,
      substance: true,
      unit: true,
      lotNumberAndExpiryDate: true,
      hintUsage: false,
      discount: true,
      expectedPrice: true,
      editActualPrice: false,
    },
    customer: {
      idDefault: 0,
    },
    paymentInfo: {
      itemsActualMoney: true,
      discount: true,
      surcharge: false,
      paid: false,
      debt: false,
      expense: false,
      totalCostAmount: true,
      profit: true,
    },
    other: { expense: false },
    save: {
      createBasicAndNew: false,
      createDraft: true,
    },
  },

  APPOINTMENT_LIST: {
    fromDateToDateDistance: -1,
  },

  APPOINTMENT_UPSERT: {
    birthday: true,
    gender: true,
    addressFull: false,
    addressBasic: true,
    relative: false,
    note: false,
    customerSource: false,
  },

  TICKET_CLINIC_LIST: {
    ticketType: TicketType.Clinic,
    ticketStatus: TicketStatus.Executing,
    buttonShowModalCreate: true,
    buttonShowTicketDetailBlank: false,
    birthday: false,
    phone: false,
    address: false,
  },
  TICKET_CLINIC_DETAIL: {
    printHtmlIdSetting: {
      invoice: 0,
      prescription: 0,
      diagnosisEyeSpecial: 0,
    },
  },
  TICKET_CLINIC_CREATE: {
    birthday: true,
    gender: true,
    addressFull: false,
    addressBasic: true,
    relative: false,
    note: false,
    customerSource: false,
    SCREEN: {
      modalStyle: 'margin-top: 100px; width: 800px',
      itemStyle: 'flex-basis: 40%; flex-grow: 1; min-width: 300px',
    },
  },
  TICKET_STATISTIC: {
    countTicket: true,
    sumTotalMoney: true,
    sumTotalCostAmount: true,
    sumProcedureMoney: true,
    sumProductMoney: true,
    sumRadiologyMoney: true,
    sumLaboratoryMoney: true,
    sumSurcharge: true,
    sumExpense: true,
    sumDiscountMoney: true,
    sumProfit: true,
    sumDebt: true,
  },
}

export const useSettingStore = defineStore('setting-store', {
  state: () => {
    return JSON.parse(JSON.stringify(settingDefault)) as typeof settingDefault
  },

  actions: {},

  getters: {
    formatMoney: (state) => {
      return (money?: number) => {
        if (!money) return '0'
        if (state.SYSTEM_SETTING.moneyDivisionFormat === 1) {
          return formatNumber({ number: money, fixed: 0 })
        }
        if (state.SYSTEM_SETTING.moneyDivisionFormat === 1000) {
          return formatNumber({
            number: money / state.SYSTEM_SETTING.moneyDivisionFormat,
            fixed: 3,
          })
        }
      }
    },
  },
})
