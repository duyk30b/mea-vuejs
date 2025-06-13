import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { useSettingStore } from '../modules/_me/setting.store'
import { TicketType } from '../modules/ticket'

export const ticketRouter: RouteRecordRaw[] = [
  {
    path: 'ticket-order',
    name: 'TicketOrder',
    meta: { title: 'Hóa đơn' },
    redirect: () => ({ name: 'TicketOrderList' }),
    children: [
      {
        path: 'list',
        name: 'TicketOrderList',

        component: () => import('../views/ticket-order/list/TicketOrderList.vue'),
      },
      {
        path: 'detail/:id',
        name: 'TicketOrderDetail',
        meta: { title: 'Thông tin đơn' },
        component: () => import('../views/ticket-order/detail/TicketOrderDetail.vue'),
      },
      {
        path: 'upsert/:id?',
        name: 'TicketOrderUpsert',
        component: () => import('../views/ticket-order/upsert/TicketOrderUpsert.vue'),
        meta: {
          title: (route: RouteLocationNormalizedLoaded) => {
            if (route.query?.mode === 'UPDATE') return 'Cập nhật'
            return 'Tạo mới'
          },
        },
      },
    ],
  },

]
