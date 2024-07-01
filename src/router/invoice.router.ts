import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const invoiceRouter: RouteRecordRaw = {
  path: 'invoice',
  name: 'Invoice',
  children: [
    {
      path: 'invoice',
      name: 'Invoice',
      redirect: () => ({ name: 'InvoiceList' }),
      children: [
        {
          path: 'list',
          name: 'InvoiceList',
          meta: { title: 'Hóa đơn' },
          component: () => import('../views/invoice/list/InvoiceList.vue'),
        },
        {
          path: 'detail/:id',
          name: 'InvoiceDetail',
          meta: { title: 'Hóa đơn' },
          component: () => import('../views/invoice/detail/InvoiceDetail.vue'),
        },
        {
          path: 'upsert/:id?',
          name: 'InvoiceUpsert',
          component: () => import('../views/invoice/upsert/InvoiceUpsert.vue'),
          meta: {
            title: (route: RouteLocationNormalizedLoaded) => {
              if (route.query?.mode === 'UPDATE') return 'Hóa đơn'
              return 'Hóa đơn'
            },
          },
        },
      ],
    },
  ],
}
