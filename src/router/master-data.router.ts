import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const masterDataRouter: RouteRecordRaw = {
  path: 'master-data',
  name: 'MasterData',
  children: [
    {
      path: 'procedure',
      name: 'Procedure',
      redirect: () => ({ name: 'ProcedureList' }),
      children: [
        {
          path: 'list',
          name: 'ProcedureList',
          component: () => import('../views/master-data/procedure/list/ProcedureList.vue'),
          meta: { title: 'Dịch vụ' },
        },
      ],
    },
    {
      path: 'laboratory',
      name: 'Laboratory',
      redirect: () => ({ name: 'LaboratoryList' }),
      children: [
        {
          path: 'list',
          name: 'LaboratoryList',
          component: () => import('../views/master-data/laboratory/list/LaboratoryList.vue'),
          meta: { title: 'Xét nghiệm' },
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
      path: 'radiology',
      name: 'Radiology',
      redirect: () => ({ name: 'RadiologyList' }),
      children: [
        {
          path: 'list',
          name: 'RadiologyList',
          component: () => import('../views/master-data/radiology/list/RadiologyList.vue'),
          meta: { title: 'CĐHA' },
        },
        {
          path: 'upsert/:id?',
          name: 'RadiologyUpsert',
          component: () => import('../views/master-data/radiology/upsert/RadiologyUpsert.vue'),
          meta: {
            title: (route: RouteLocationNormalizedLoaded) => {
              if (route.query?.mode === 'UPDATE') return 'Cập nhật phiếu CĐHA'
              return 'Tạo mới phiếu CĐHA'
            },
          },
        },
      ],
    },
    {
      path: 'warehouse',
      name: 'Warehouse',
      redirect: () => ({ name: 'WarehouseList' }),
      children: [
        {
          path: 'list',
          name: 'WarehouseList',
          component: () => import('../views/master-data/warehouse/WarehouseList.vue'),
          meta: { title: 'Dịch vụ' },
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
    {
      path: 'print-html',
      name: 'PrintHtml',
      redirect: () => ({ name: 'PrintHtmlList' }),
      children: [
        {
          path: 'list',
          name: 'PrintHtmlList',
          component: () => import('../views/master-data/print-html/PrintHtmlList.vue'),
          meta: { title: 'Mẫu in' },
        },
        {
          path: 'upsert/:id?',
          name: 'PrintHtmlUpsert',
          component: () => import('../views/master-data/print-html/upsert/PrintHtmlUpsert.vue'),
          meta: {
            title: (route: RouteLocationNormalizedLoaded) => {
              if (route.query?.mode === 'UPDATE') return 'Cập nhật mẫu in'
              return 'Tạo mới mẫu in'
            },
          },
        },
      ],
    },
  ],
}
