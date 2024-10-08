import type { RouteRecordRaw } from 'vue-router'

export const clinicRouter: RouteRecordRaw = {
  path: 'clinic',
  name: 'Clinic',
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
          component: () => import('../views/ticket-clinic/detail/TicketClinicDetailContainer.vue'),
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
              component: () => import('../views/ticket-clinic/detail/TicketClinicPrescription.vue'),
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
          component: () => import('../views/appointment/AppointmentList.vue'),
          meta: { title: 'Hẹn khám' },
        },
      ],
    },
  ],
}
