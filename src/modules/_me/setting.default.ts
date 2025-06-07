import {
  PickupStrategy,
  SplitBatchByCostPrice,
  SplitBatchByDistributor,
  SplitBatchByExpiryDate,
  SplitBatchByWarehouse,
} from '../enum'
import { TicketStatus, TicketType } from '../ticket'

export const SETTING_DEFAULT = {
  isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 900,
  // isMobile: window.innerWidth <= 768,
  GOOGLE_DRIVER: { email: '' },
  SYSTEM_SETTING: {
    moneyDivisionFormat: 1,
    wholesalePrice: false,
  },
  PRINT_SETTING: {
    _LAYOUT_HEADER: {
      printHtmlId: 0,
    },
    invoice: {
      printHtmlId: 0,
      customVariables: '',
      customStyles: '',
    },
    prescription: {
      printHtmlId: 0,
      customVariables: '',
      customStyles: '',
    },
    optometry: {
      printHtmlId: 0,
      customVariables: '',
      customStyles: '',
    },
    radiology: {
      printHtmlId: 0,
      customVariables: '',
      customStyles: '',
    },
    laboratory: {
      printHtmlId: 0,
      customVariables: '',
      customStyles: '',
    },
  },
  PRODUCT_SETTING: {
    allowNegativeQuantity: false,
    pickupStrategy: PickupStrategy.Inherit,
    splitBatchByWarehouse: SplitBatchByWarehouse.Inherit,
    splitBatchByDistributor: SplitBatchByDistributor.Inherit,
    splitBatchByExpiryDate: SplitBatchByExpiryDate.Inherit,
    splitBatchByCostPrice: SplitBatchByCostPrice.Inherit,
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
    miss: 'Thất thoát',
    package: 'Đóng gói',
  },

  SCREEN_PRODUCT_LIST: {
    detail: true,
    substance: false,
    group: true,
    warehouse: false,
    distributor: false,
    expiryDate: true,
    unit: false,
    costPrice: true,
    action: true,
  },
  SCREEN_PRODUCT_DETAIL: {},
  SCREEN_PRODUCT_UPSERT: {
    substance: false,
    unit: false,
    group: false,
    source: false,
    route: false,
    hintUsage: false,
  },

  SCREEN_PROCEDURE_LIST: {
    table: { detail: true, group: true, status: true, action: true },
    upsert: {},
  },
  SCREEN_PROCEDURE_DETAIL: {},
  SCREEN_PROCEDURE_UPSERT: {},

  SCREEN_LABORATORY_LIST: {},
  SCREEN_RADIOLOGY_LIST: {
    table: { printHtml: false },
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
    facebook: false,
    zalo: false,
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
      batchCodeAndExpiryDate: true,
      unit: true,
      warehouse: true,
    },
    paymentInfo: {
      itemsActualMoney: true,
      discount: true,
      surcharge: true,
      paid: true,
      debt: true,
    },
  },
  SCREEN_RECEIPT_UPSERT: {
    receiptItemsSelect: {
      warehouse: false,
      batchCodeAndExpiryDate: true,
    },
    receiptItemsTable: {
      detail: true,
      substance: true,
      batchCodeAndExpiryDate: true,
      unit: true,
      warehouse: false,
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
    note: true,
  },
  SCREEN_INVOICE_DETAIL: {
    invoiceItemsTable: {
      detail: true,
      substance: true,
      hintUsage: true,
      unit: true,
      discount: true,
      expectedPrice: true,
    },
    paymentInfo: {
      itemsActualMoney: true,
      discount: true,
      surcharge: true,
      itemsCostAmount: true,
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
      warehouseIdList: [0],
      searchIncludeZeroQuantity: false,
      hintUsage: false,
      expectedPrice: true,
      costPrice: true,
      quantity: true,
      discount: true,
      actualPrice: true,
      buttonSubmit: true,
    },
    invoiceItemsTable: {
      allowOverQuantity: false,
      allowDuplicateItem: true,
      detail: true,
      substance: true,
      unit: true,
      discount: true,
      expectedPrice: true,
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
      itemsCostAmount: true,
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
    customTypeText: <string[]>['Mặc định'],
    showCustomType: false,
    buttonShowModalCreate: true,
    buttonShowTicketDetailBlank: false,
    roleIdList: [],
    birthday: false,
    phone: false,
    address: false,
  },
  TICKET_CLINIC_DETAIL: {
    consumable: {
      warehouseIdList: [0],
      searchIncludeZeroQuantity: 1,
    },
    procedure: {},
    prescriptions: {
      warehouseIdList: [0],
      searchIncludeZeroQuantity: 1,
    },
  },
  TICKET_CLINIC_CREATE: {
    status: TicketStatus.Executing,
    facebook: false,
    zalo: false,
    birthday: true,
    gender: true,
    addressFull: false,
    addressBasic: true,
    relative: false,
    note: false,
    customerSource: false,
    roleIdList: [],
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
