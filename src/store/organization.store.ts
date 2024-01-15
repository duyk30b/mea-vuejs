import { defineStore } from 'pinia'
import { Customer } from '../modules/customer'
import { Distributor } from '../modules/distributor'
import { OrganizationService } from '../modules/organization'
import { Organization } from '../modules/organization/organization.model'
import { formatMoney, objectUpdatePropertyByObject } from '../utils'
import { OrganizationSettingsType } from './store.variable'

export const useOrganizationStore = defineStore('organization-store', {
  state: () => {
    return {
      // const isMobile = ref(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
      isMobile: window.innerWidth <= 768,

      organizationInfo: Organization.blank(),
      distributorDefault: Distributor.blank(),
      customerDefault: Customer.blank(),

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
          itemsActualMoney: true,
          discount: true,
          surcharge: true,
          paid: true,
          debt: true,
        },
        receiptProcessType: 1,
        function: {
          forceEdit: false,
        },
      },
      SCREEN_RECEIPT_UPSERT: {
        receiptItemInput: {
          batch: false,
          expiryDate: false,
          expectedPrice: true,
          retailPrice: true,
          wholesalePrice: false,
        },
        receiptItemsTable: {
          allowDuplicateItem: true,
          detail: false,
          substance: false,
          batch: false,
          expiryDate: false,
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
          substance: false,
          batch: false,
          expiryDate: false,
          hintUsage: false,
          unit: true,
          discount: false,
          expectedPrice: true,
        },
        paymentInfo: {
          itemsActualMoney: false,
          surcharge: false,
          discount: false,
          paid: true,
          debt: false,
        },
        invoiceProcessType: 1,
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
          searchType: 'PRODUCT_BATCH',
          customAfterSearch: true,
          hintUsage: false,
          expectedPrice: true,
          retailPrice: true,
          wholesalePrice: false,
          costPrice: false,
          quantity: true,
          discount: false,
          actualPrice: true,
        },
        invoiceItemsTable: {
          allowOverQuantity: false,
          allowDuplicateItem: true,
          detail: false,
          substance: false,
          unit: true,
          batch: false,
          expiryDate: false,
          hintUsage: false,
          discount: false,
          expectedPrice: false,
          editActualPrice: false,
        },
        customer: {
          idDefault: 1,
        },
        paymentInfo: {
          itemsActualMoney: false,
          discount: false,
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

  actions: {
    async initData() {
      try {
        const { settings, organization, distributorDefault, customerDefault } =
          await OrganizationService.info()
        this.organizationInfo = organization
        this.distributorDefault = distributorDefault
        this.customerDefault = customerDefault

        Object.keys(settings || {}).forEach((key) => {
          if (
            [
              OrganizationSettingsType.PRODUCT_GROUP,
              OrganizationSettingsType.PROCEDURE_GROUP,
              OrganizationSettingsType.INVOICE_SURCHARGE_DETAIL,
              OrganizationSettingsType.INVOICE_EXPENSE_DETAIL,
            ].includes(key as any)
          ) {
            this[key as keyof typeof OrganizationSettingsType] = JSON.parse(settings[key])
          } else {
            this[key as keyof typeof OrganizationSettingsType] = objectUpdatePropertyByObject(
              this[key as keyof typeof OrganizationSettingsType] as any,
              JSON.parse(settings[key])
            )
          }
        })
      } catch (error) {
        console.log('🚀 ~ file: organization.store.ts:19 ~ init ~ error:', error)
      }
    },
  },

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
