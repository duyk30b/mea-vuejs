import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const ticketRouter: RouteRecordRaw[] = [
  {
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
  },
  {
    path: 'clinic',
    name: 'TicketClinic',
    children: [
      {
        path: 'ticket-clinic',
        name: 'TicketClinic',
        redirect: () => ({ name: 'TicketClinicList' }),
        children: [
          {
            path: 'list',
            name: 'TicketClinicList',
            component: () => import('../views/ticket-clinic/list/TicketClinicList.vue'),
            meta: { title: 'Danh sách khám' },
          },
          {
            path: 'detail/:id',
            name: 'TicketClinicDetailContainer',
            component: () =>
              import('../views/ticket-clinic/detail/TicketClinicDetailContainer.vue'),
            meta: { title: 'Khám bệnh' },
            redirect: () => ({ name: 'TicketClinicDiagnosis' }),
            children: [
              {
                path: 'diagnosis',
                name: 'TicketClinicDiagnosis',
                component: () => import('../views/ticket-clinic/detail/TicketClinicDiagnosis.vue'),
                meta: { keepAlive: true, title: 'Chẩn đoán' },
              },
              {
                path: 'procedure',
                name: 'TicketClinicProcedure',
                component: () => import('../views/ticket-clinic/detail/TicketClinicProcedure.vue'),
                meta: { keepAlive: true, title: 'Chỉ định dịch vụ' },
              },
              {
                path: 'radiology',
                name: 'TicketClinicRadiology',
                component: () => import('../views/ticket-clinic/detail/TicketClinicRadiology.vue'),
                meta: { keepAlive: true, title: 'Chỉ định CĐHA' },
              },
              {
                path: 'consumable',
                name: 'TicketClinicConsumable',
                component: () => import('../views/ticket-clinic/detail/TicketClinicConsumable.vue'),
                meta: { keepAlive: true, title: 'Vật tư' },
              },
              {
                path: 'prescription',
                name: 'TicketClinicPrescription',
                component: () =>
                  import('../views/ticket-clinic/detail/TicketClinicPrescription.vue'),
                meta: { keepAlive: true, title: 'Kê đơn thuốc' },
              },
              {
                path: 'summary',
                name: 'TicketClinicSummary',
                component: () => import('../views/ticket-clinic/detail/TicketClinicSummary.vue'),
                meta: { title: 'Tổng kết' },
              },
            ],
          },
        ],
      },
      {
        path: 'appointment',
        name: 'Appointment',
        redirect: () => ({ name: 'AppointmentList' }),
        children: [
          {
            path: 'list',
            name: 'AppointmentList',
            component: () => import('../views/ticket-clinic/appointment/AppointmentList.vue'),
            meta: { title: 'Hẹn khám' },
          },
        ],
      },
    ],
  },
  {
    path: 'ticket-traditional',
    name: 'TicketTraditional',
    redirect: () => ({ name: 'TicketTraditionalList' }),
    children: [
      {
        path: 'list',
        name: 'TicketTraditionalList',
        meta: { title: 'Đông Y' },
        component: () => import('../views/ticket-traditional/list/TicketTraditionalList.vue'),
      },
      // {
      //   path: 'detail/:id',
      //   name: 'TicketTraditionalDetail',
      //   meta: { title: 'Đông Y' },
      //   component: () => import('../views/ticket-traditional/detail/TicketTraditionalDetail.vue'),
      // },
      // {
      //   path: 'upsert/:id?',
      //   name: 'TicketTraditionalUpsert',
      //   component: () => import('../views/ticket-traditional/upsert/TicketTraditionalUpsert.vue'),
      //   meta: {
      //     title: (route: RouteLocationNormalizedLoaded) => {
      //       if (route.query?.mode === 'UPDATE') return 'Đông Y'
      //       return 'Đông Y'
      //     },
      //   },
      // },
    ],
  },
  {
    path: 'ticket-spa',
    name: 'TicketSpa',
    redirect: () => ({ name: 'TicketSpaList' }),
    children: [
      {
        path: 'list',
        name: 'TicketSpaList',
        meta: { title: 'Phòng Thẩm Mỹ' },
        component: () => import('../views/ticket-spa/ticket-spa-list/TicketSpaList.vue'),
      },
      {
        path: 'detail/:id',
        name: 'TicketSpaDetailContainer',
        component: () => import('../views/ticket-spa/detail/TicketSpaDetailContainer.vue'),
        meta: { title: 'Khám bệnh' },
        redirect: () => ({ name: 'TicketSpaDiagnosis' }),
        children: [
          {
            path: 'diagnosis',
            name: 'TicketSpaDiagnosis',
            component: () => import('../views/ticket-spa/detail/TicketSpaDiagnosis.vue'),
            meta: { keepAlive: true, title: 'Chẩn đoán' },
          },
          {
            path: 'procedure',
            name: 'TicketSpaProcedure',
            component: () => import('../views/ticket-spa/detail/TicketSpaProcedure.vue'),
            meta: { keepAlive: true, title: 'Chỉ định dịch vụ' },
          },
          {
            path: 'radiology',
            name: 'TicketSpaRadiology',
            component: () => import('../views/ticket-spa/detail/TicketSpaRadiology.vue'),
            meta: { keepAlive: true, title: 'Chỉ định CĐHA' },
          },
          {
            path: 'consumable',
            name: 'TicketSpaConsumable',
            component: () => import('../views/ticket-spa/detail/TicketSpaConsumable.vue'),
            meta: { keepAlive: true, title: 'Vật tư' },
          },
          {
            path: 'prescription',
            name: 'TicketSpaPrescription',
            component: () => import('../views/ticket-spa/detail/TicketSpaPrescription.vue'),
            meta: { keepAlive: true, title: 'Kê đơn thuốc' },
          },
          {
            path: 'summary',
            name: 'TicketSpaSummary',
            component: () => import('../views/ticket-spa/detail/TicketSpaSummary.vue'),
            meta: { title: 'Tổng kết' },
          },
        ],
      },
    ],
  },
]
