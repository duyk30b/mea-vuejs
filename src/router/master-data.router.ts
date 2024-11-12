import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const masterDataRouter: RouteRecordRaw = {
  path: 'master-data',
  name: 'MasterData',
  children: [
    {
      path: 'paraclinical',
      name: 'Paraclinical',
      redirect: () => ({ name: 'ParaclinicalList' }),
      children: [
        {
          path: 'list',
          name: 'ParaclinicalList',
          component: () => import('../views/master-data/paraclinical/ParaclinicalList.vue'),
          meta: { title: 'Cận lâm sàng' },
        },
        {
          path: 'upsert/:id?',
          name: 'ParaclinicalUpsert',
          component: () => import('../views/master-data/paraclinical/upsert/ParaclinicalUpsert.vue'),
          meta: {
            title: (route: RouteLocationNormalizedLoaded) => {
              if (route.query?.mode === 'UPDATE') return 'Cập nhật phiếu cận lâm sàng'
              return 'Tạo mới phiếu cận lâm sàng'
            },
          },
        },
      ],
    },
    {
      path: 'procedure',
      name: 'Procedure',
      redirect: () => ({ name: 'ProcedureList' }),
      children: [
        {
          path: 'list',
          name: 'ProcedureList',
          component: () => import('../views/procedure/ProcedureList.vue'),
          meta: { title: 'Dịch vụ' },
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
      path: 'product-group',
      name: 'ProductGroup',
      redirect: () => ({ name: 'ProductGroupList' }),
      children: [
        {
          path: 'list',
          name: 'ProductGroupList',
          component: () => import('../views/master-data/product-group/ProductGroupList.vue'),
          meta: { title: 'Dịch vụ' },
        },
      ],
    },
    {
      path: 'procedure-group',
      name: 'ProcedureGroup',
      redirect: () => ({ name: 'ProcedureGroupList' }),
      children: [
        {
          path: 'list',
          name: 'ProcedureGroupList',
          component: () => import('../views/master-data/procedure-group/ProcedureGroupList.vue'),
          meta: { title: 'Dịch vụ' },
        },
      ],
    },
    {
      path: 'paraclinical-group',
      name: 'ParaclinicalGroup',
      redirect: () => ({ name: 'ParaclinicalGroupList' }),
      children: [
        {
          path: 'list',
          name: 'ParaclinicalGroupList',
          component: () =>
            import('../views/master-data/paraclinical-group/ParaclinicalGroupList.vue'),
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
          component: () => import('../views/master-data/print-html/PrintHtmlUpsert.vue'),
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
