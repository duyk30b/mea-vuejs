import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const masterDataRouter: RouteRecordRaw = {
  path: 'master-data',
  name: 'MasterData',
  meta: { title: 'Danh mục' },
  redirect: () => ({ name: 'MasterDataList' }),
  children: [
    {
      path: '',
      name: 'MasterDataList',
      component: () => import('../views/master-data/MasterData.vue'),
    },
    {
      path: 'procedure',
      name: 'Procedure',
      meta: { title: 'Dịch vụ' },
      redirect: () => ({ name: 'ProcedureList' }),
      children: [
        {
          path: 'list',
          name: 'ProcedureList',
          component: () => import('../views/master-data/procedure/list/ProcedureList.vue'),
        },
      ],
    },
    {
      path: 'laboratory',
      name: 'Laboratory',
      meta: { title: 'Xét nghiệm' },
      redirect: () => ({ name: 'LaboratoryList' }),
      children: [
        {
          path: 'list',
          name: 'LaboratoryList',
          component: () => import('../views/master-data/laboratory/list/LaboratoryList.vue'),
        },
      ],
    },
    {
      path: 'radiology',
      name: 'Radiology',
      meta: { title: 'Chẩn đoán hình ảnh' },
      redirect: () => ({ name: 'RadiologyList' }),
      children: [
        {
          path: 'list',
          name: 'RadiologyList',
          component: () => import('../views/master-data/radiology/list/RadiologyList.vue'),
        },
        {
          path: 'upsert/:id?',
          name: 'RadiologyUpsert',
          component: () => import('../views/master-data/radiology/upsert/RadiologyUpsert.vue'),
          meta: {
            title: (route: RouteLocationNormalizedLoaded) => {
              if (route.params.id) return 'Cập nhật phiếu CĐHA'
              return 'Tạo mới phiếu CĐHA'
            },
          },
        },
      ],
    },
    {
      path: 'print-html',
      name: 'PrintHtml',
      meta: { title: 'Mẫu in' },
      redirect: () => ({ name: 'PrintHtmlContainer' }),
      children: [
        {
          path: 'list',
          name: 'PrintHtmlContainer',
          component: () => import('../views/master-data/print-html/PrintHtmlContainer.vue'),
        },
        {
          path: 'upsert/:id?',
          name: 'PrintHtmlUpsert',
          component: () => import('../views/master-data/print-html/upsert/PrintHtmlUpsert.vue'),
          meta: {
            title: (route: RouteLocationNormalizedLoaded) => {
              if (route.params.id) return 'Cập nhật mẫu in'
              return 'Tạo mới mẫu in'
            },
          },
        },
      ],
    },

    {
      path: 'master-data-room',
      name: 'MasterDataRoom',
      meta: { title: 'Danh sách phòng' },
      redirect: () => ({ name: 'MasterDataRoomList' }),
      children: [
        {
          path: 'list',
          name: 'MasterDataRoomList',
          component: () => import('../views/master-data/room/RoomList.vue'),
        },
      ],
    },
    {
      path: 'warehouse',
      name: 'Warehouse',
      meta: { title: 'Danh sách kho' },
      redirect: () => ({ name: 'WarehouseList' }),
      children: [
        {
          path: 'list',
          name: 'WarehouseList',
          component: () => import('../views/master-data/warehouse/WarehouseList.vue'),
        },
      ],
    },
    {
      path: 'position',
      meta: { title: 'Vị trí' },
      name: 'Position',
      component: () => import('../views/master-data/position/list/PositionList.vue'),
    },
    {
      path: 'discount',
      name: 'Discount',
      meta: { title: 'Khuyến mại' },
      redirect: () => ({ name: 'DiscountList' }),
      children: [
        {
          path: 'list',
          name: 'DiscountList',
          component: () => import('../views/master-data/discount/list/DiscountList.vue'),
        },
      ],
    },
    {
      path: 'payment-method',
      name: 'PaymentMethod',
      meta: { title: 'Phương thức thanh toán' },
      redirect: () => ({ name: 'PaymentMethodList' }),
      children: [
        {
          path: 'list',
          name: 'PaymentMethodList',
          component: () => import('../views/master-data/payment-method/PaymentMethodList.vue'),
        },
      ],
    },
    {
      path: 'surcharge',
      name: 'Surcharge',
      meta: { title: 'Phụ phí' },
      redirect: () => ({ name: 'SurchargeList' }),
      children: [
        {
          path: 'list',
          name: 'SurchargeList',
          component: () => import('../views/master-data/surcharge/SurchargeList.vue'),
        },
      ],
    },
    {
      path: 'expense',
      name: 'Expense',
      meta: { title: 'Chi phí' },
      redirect: () => ({ name: 'ExpenseList' }),
      children: [
        {
          path: 'list',
          name: 'ExpenseList',
          component: () => import('../views/master-data/expense/ExpenseList.vue'),
        },
      ],
    },

    {
      path: 'customer-source',
      name: 'CustomerSource',
      redirect: () => ({ name: 'CustomerSourceList' }),
      meta: { title: 'Nguồn khách hàng' },
      children: [
        {
          path: 'list',
          name: 'CustomerSourceList',
          component: () => import('../views/master-data/customer-source/CustomerSourceList.vue'),
        },
      ],
    },

    {
      path: 'prescription-sample',
      name: 'PrescriptionSample',
      redirect: () => ({ name: 'PrescriptionSampleList' }),
      meta: { title: 'Đơn thuốc mẫu' },
      children: [
        {
          path: 'list',
          name: 'PrescriptionSampleList',
          component: () =>
            import('../views/master-data/prescription-sample/list/PrescriptionSampleList.vue'),
        },
      ],
    },

    {
      path: 'laboratory-sample',
      name: 'LaboratorySample',
      redirect: () => ({ name: 'LaboratorySampleList' }),
      meta: { title: 'Bộ xét nghiệm' },
      children: [
        {
          path: 'list',
          name: 'LaboratorySampleList',
          component: () =>
            import('../views/master-data/laboratory-sample/list/LaboratorySampleList.vue'),
        },
      ],
    },

    {
      path: 'radiology-sample',
      name: 'RadiologySample',
      redirect: () => ({ name: 'RadiologySampleList' }),
      meta: { title: 'Mẫu phiếu KQ CĐHA' },
      children: [
        {
          path: 'list',
          name: 'RadiologySampleList',
          component: () =>
            import('../views/master-data/radiology-sample/list/RadiologySampleList.vue'),
        },
        {
          path: 'upsert/:id?',
          name: 'RadiologySampleUpsert',
          component: () =>
            import('../views/master-data/radiology-sample/upsert/RadiologySampleUpsert.vue'),
          meta: {
            title: (route: RouteLocationNormalizedLoaded) => {
              if (route.params.id) return 'Cập nhật mẫu kết quả'
              return 'Tạo mới mẫu kết quả'
            },
          },
        },
      ],
    },
  ],
}
