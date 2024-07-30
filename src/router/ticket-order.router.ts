import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const ticketOrderRouter: RouteRecordRaw = {
  path: 'ticket-order',
  name: 'TicketOrder',
  redirect: () => ({ name: 'TicketOrderList' }),
  children: [
    {
      path: 'list',
      name: 'TicketOrderList',
      meta: { title: 'Hóa đơn' },
      component: () => import('../views/ticket-order/list/TicketOrderList.vue'),
    },
    {
      path: 'detail/:id',
      name: 'TicketOrderDetail',
      meta: { title: 'Hóa đơn' },
      component: () => import('../views/ticket-order/detail/TicketOrderDetail.vue'),
    },
    {
      path: 'upsert/:id?',
      name: 'TicketOrderUpsert',
      component: () => import('../views/ticket-order/upsert/TicketOrderUpsert.vue'),
      meta: {
        title: (route: RouteLocationNormalizedLoaded) => {
          if (route.query?.mode === 'UPDATE') return 'Hóa đơn'
          return 'Hóa đơn'
        },
      },
    },
  ],
}
