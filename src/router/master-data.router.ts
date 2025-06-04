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
      path: 'laboratory-kit',
      name: 'LaboratoryKit',
      redirect: () => ({ name: 'LaboratoryKitList' }),
      children: [
        {
          path: 'list',
          name: 'LaboratoryKitList',
          component: () => import('../views/master-data/laboratory-kit/list/LaboratoryKitList.vue'),
          meta: { title: 'Bộ xét nghiệm' },
        },
      ],
    },
    {
      path: 'prescription-sample',
      name: 'PrescriptionSample',
      redirect: () => ({ name: 'PrescriptionSampleList' }),
      children: [
        {
          path: 'list',
          name: 'PrescriptionSampleList',
          component: () =>
            import('../views/master-data/prescription-sample/list/PrescriptionSampleList.vue'),
          meta: { title: 'Bộ xét nghiệm' },
        },
      ],
    },
    {
      path: 'customer-source',
      name: 'CustomerSource',
      redirect: () => ({ name: 'CustomerSourceList' }),
      children: [
        {
          path: 'list',
          name: 'CustomerSourceList',
          component: () => import('../views/master-data/customer-source/CustomerSourceList.vue'),
          meta: { title: 'Dịch vụ' },
        },
      ],
    },
  ],
}
