import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const invoiceRouter: RouteRecordRaw = {
  path: 'invoice',
  name: 'Invoice',
  children: [
    {
      path: 'visit',
      name: 'InvoiceVisit',
      redirect: () => ({ name: 'InvoiceVisitList' }),
      children: [
        {
          path: 'list',
          name: 'InvoiceVisitList',
          meta: { title: 'Hóa đơn' },
          component: () => import('../views/invoice/list/InvoiceVisitList.vue'),
        },
        {
          path: 'detail/:id',
          name: 'InvoiceVisitDetail',
          meta: { title: 'Hóa đơn' },
          component: () => import('../views/invoice/detail/InvoiceVisitDetail.vue'),
        },
        {
          path: 'upsert/:id?',
          name: 'InvoiceVisitUpsert',
          component: () => import('../views/invoice/upsert/InvoiceVisitUpsert.vue'),
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
