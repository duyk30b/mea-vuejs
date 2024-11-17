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
          component: () => import('../views/procedure/ProcedureList.vue'),
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
        {
          path: 'upsert/:id?',
          name: 'LaboratoryUpsert',
          component: () => import('../views/master-data/laboratory/upsert/LaboratoryUpsert.vue'),
          meta: {
            title: (route: RouteLocationNormalizedLoaded) => {
              if (route.query?.mode === 'UPDATE') return 'Cập nhật xét nghiệm'
              return 'Tạo mới xét nghiệm'
            },
          },
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
      path: 'radiology-group',
      name: 'RadiologyGroup',
      redirect: () => ({ name: 'RadiologyGroupList' }),
      children: [
        {
          path: 'list',
          name: 'RadiologyGroupList',
          component: () => import('../views/master-data/radiology-group/RadiologyGroupList.vue'),
          meta: { title: 'CĐHA' },
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
