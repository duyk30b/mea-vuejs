import {
  PickupStrategy,
  SplitBatchByCostPrice,
  SplitBatchByDistributor,
  SplitBatchByExpiryDate,
  SplitBatchByWarehouse,
} from '../enum'

export const SETTING_DEFAULT = {
  isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 900,
  // isMobile: window.innerWidth <= 768,
  GOOGLE_DRIVER: { email: '' },
  dataVersionParse: { address: 1, icd: 1 },
  SYSTEM_SETTING: {
    moneyDivisionFormat: 1,
    wholesalePrice: false,
  },
  PRODUCT_SETTING: {
    allowNegativeQuantity: false,
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

  SCREEN_PRODUCT_LIST: {
    zeroQuantity: false,
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
    unit: true,
    source: false,
    route: false,
    hintUsage: false,
  },

  SCREEN_PROCEDURE_LIST: {
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
    address: true,
    relative: false,
    note: false,
    customerSource: false,
  },

  SCREEN_PURCHASE_ORDER_LIST: {
    purchaseOrderItems: false,
  },
  SCREEN_PURCHASE_ORDER_DETAIL: {
    purchaseOrderItemsTable: {
      substance: true,
      detail: true,
      lotNumberAndExpiryDate: true,
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
  SCREEN_PURCHASE_ORDER_UPSERT: {
    purchaseOrderItemsSelect: {
      warehouse: false,
      lotNumberAndExpiryDate: true,
    },
    purchaseOrderItemsTable: {
      detail: true,
      substance: true,
      lotNumberAndExpiryDate: true,
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
    pickupStrategy: PickupStrategy.Inherit,
    invoiceItemInput: {
      warehouseIdList: [0],
      searchIncludeZeroQuantity: true,
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
      paid: false,
      debt: false,
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
    address: true,
    relative: false,
    note: false,
    customerSource: false,
  },

  RECEPTION_TICKET_LIST: {
    roleIdList: [],
    birthday: false,
    phone: false,
    address: true,
  },

  TICKET_CLINIC_CREATE: {
    birthday: true,
    gender: true,
    address: true,
    customerSource: false,
    roleIdList: [],
    requestProcedure: false,
    SCREEN: {
      modalStyle: 'width: 800px',
      itemStyle: 'flex-basis: 40%; flex-grow: 1; min-width: 300px',
    },
  },

  TICKET_CLINIC_LIST: {
    isPaymentEachItem: 0,
    includePendingStatus: false,
    goRoomAfterReception: true,
    procedure: false,
    roleIdList: [],
    phoneAndAddress: true,
    note: true,
    payment: false,
  },
  TICKET_CLINIC_DETAIL: {
    diagnosis: { icd10: 0 },
    procedure: {},
    consumable: {
      warehouseIdList: [0],
      searchIncludeZeroQuantity: 1,
      pickupStrategy: PickupStrategy.Inherit,
    },
    prescriptions: {
      warehouseIdList: [0],
      searchIncludeZeroQuantity: 1,
      pickupStrategy: PickupStrategy.Inherit,
    },
    laboratory: {},
    radiology: {},
  },
  TICKET_SPA_LIST: {
    roleIdList: [],
  },
  TICKET_SPA_DETAIL: {
    product: {
      warehouseIdList: [0],
      searchIncludeZeroQuantity: 1,
      pickupStrategy: PickupStrategy.Inherit,
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

  ROOM_TICKET_REGISTER: {
    facebook: false,
    zalo: false,
    birthday: true,
    gender: true,
    address: true,
    relative: false,
    note: false,
    customerSource: false,
    roleIdList: [],
    requestProcedure: false,
    SCREEN: {
      modalStyle: 'width: 800px',
      itemStyle: 'flex-basis: 40%; flex-grow: 1; min-width: 300px',
    },
  },
}
