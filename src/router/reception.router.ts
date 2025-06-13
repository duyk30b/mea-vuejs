import type { RouteRecordRaw } from 'vue-router'

export const receptionRouter: RouteRecordRaw = {
  path: 'reception',
  name: 'Reception',
  redirect: () => ({ name: 'ReceptionTicketList' }),
  children: [
    {
      path: 'reception-ticket-list',
      name: 'ReceptionTicketList',
      component: () => import('../views/reception/reception-ticket/ReceptionTicketList.vue'),
      meta: { title: 'DS Tiếp đón' },
    },
    {
      path: 'appointment-list',
      name: 'AppointmentList',
      component: () => import('../views/reception/appointment/list/AppointmentList.vue'),
      meta: { title: 'Hẹn khám' },
    },
  ],
}
