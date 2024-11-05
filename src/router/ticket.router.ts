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
        path: 'appointment',
        name: 'Appointment',
        redirect: () => ({ name: 'AppointmentList' }),
        children: [
          {
            path: 'list',
            name: 'AppointmentList',
            component: () => import('../views/ticket-clinic/appointment/AppointmentClinicList.vue'),
            meta: { title: 'Hẹn khám' },
          },
        ],
      },
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
            redirect: () => ({ name: 'TicketClinicDiagnosisBasic' }),
            children: [
              {
                path: 'diagnosis-basic',
                name: 'TicketClinicDiagnosisBasic',
                component: () => import('../views/ticket-clinic/detail/TicketClinicDiagnosisBasic.vue'),
                meta: { keepAlive: true, title: 'Khám' },
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
    ],
  },
  {
    path: 'clinic-eye',
    name: 'ClinicEye',
    children: [
      {
        path: 'appointment',
        name: 'AppointmentEye',
        redirect: () => ({ name: 'AppointmentEyeList' }),
        children: [
          {
            path: 'list',
            name: 'AppointmentEyeList',
            component: () => import('../views/ticket-eye/appointment/AppointmentEyeList.vue'),
            meta: { title: 'Hẹn khám' },
          },
        ],
      },
      {
        path: 'ticket-eye',
        name: 'TicketEye',
        redirect: () => ({ name: 'TicketEyeList' }),
        children: [
          {
            path: 'list',
            name: 'TicketEyeList',
            component: () => import('../views/ticket-eye/list/TicketEyeList.vue'),
            meta: { title: 'Danh sách khám' },
          },
          {
            path: 'detail/:id',
            name: 'TicketEyeDetailContainer',
            component: () => import('../views/ticket-eye/detail/TicketEyeDetailContainer.vue'),
            meta: { title: 'Khám bệnh' },
            redirect: () => ({ name: 'TicketEyeDiagnosisBasic' }),
            children: [
              {
                path: 'diagnosis-basic',
                name: 'TicketEyeDiagnosisBasic',
                component: () => import('../views/ticket-eye/detail/TicketEyeDiagnosisBasic.vue'),
                meta: { keepAlive: true, title: 'Khám' },
              },
              {
                path: 'diagnosis-special',
                name: 'TicketEyeDiagnosisSpecial',
                component: () => import('../views/ticket-eye/detail/TicketEyeDiagnosisSpecial.vue'),
                meta: { keepAlive: true, title: 'Đo thị lực' },
              },
              {
                path: 'procedure',
                name: 'TicketEyeProcedure',
                component: () => import('../views/ticket-eye/detail/TicketEyeProcedure.vue'),
                meta: { keepAlive: true, title: 'Chỉ định dịch vụ' },
              },
              // {
              //   path: 'radiology',
              //   name: 'TicketEyeRadiology',
              //   component: () => import('../views/ticket-eye/detail/TicketEyeRadiology.vue'),
              //   meta: { keepAlive: true, title: 'Chỉ định CĐHA' },
              // },
              {
                path: 'consumable',
                name: 'TicketEyeConsumable',
                component: () => import('../views/ticket-eye/detail/TicketEyeConsumable.vue'),
                meta: { keepAlive: true, title: 'Vật tư' },
              },
              {
                path: 'prescription',
                name: 'TicketEyePrescription',
                component: () => import('../views/ticket-eye/detail/TicketEyePrescription.vue'),
                meta: { keepAlive: true, title: 'Kê đơn thuốc' },
              },
              {
                path: 'summary',
                name: 'TicketEyeSummary',
                component: () => import('../views/ticket-eye/detail/TicketEyeSummary.vue'),
                meta: { title: 'Tổng kết' },
              },
            ],
          },
        ],
      },
    ],
  },
]
