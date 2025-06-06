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
  {
    path: 'clinic',
    name: 'Clinic',
    redirect: () => ({ name: 'TicketClinicList' }),
    children: [
      {
        path: 'appointment',
        name: 'Appointment',
        redirect: () => ({ name: 'AppointmentList' }),
        children: [
          {
            path: 'list',
            name: 'AppointmentList',
            component: () => import('../views/appointment/list/AppointmentList.vue'),
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
            redirect: () => {
              const ticketTypeDefault = useSettingStore().TICKET_CLINIC_LIST.ticketType
              if (ticketTypeDefault === TicketType.Clinic) {
                return { name: 'TicketClinicDiagnosisGeneral' }
              }
              if (ticketTypeDefault === TicketType.Obstetric) {
                return { name: 'TicketClinicDiagnosisObstetric' }
              }
              if (ticketTypeDefault === TicketType.Eye) {
                return { name: 'TicketClinicDiagnosisEyeBasic' }
              }
              return { name: 'TicketClinicDiagnosisGeneral' }
            },
            children: [
              {
                path: 'diagnosis-general',
                name: 'TicketClinicDiagnosisGeneral',
                component: () =>
                  import('../views/ticket-clinic/detail/TicketClinicDiagnosisGeneral.vue'),
                meta: { keepAlive: true, title: 'Khám' },
              },
              {
                path: 'diagnosis-obstetrics',
                name: 'TicketClinicDiagnosisObstetric',
                component: () =>
                  import('../views/ticket-clinic/detail/TicketClinicDiagnosisObstetric.vue'),
                meta: { keepAlive: true, title: 'Khám' },
              },
              {
                path: 'diagnosis-eye-basic',
                name: 'TicketClinicDiagnosisEyeBasic',
                component: () =>
                  import('../views/ticket-clinic/detail/TicketClinicDiagnosisEyeBasic.vue'),
                meta: { keepAlive: true, title: 'Khám' },
              },
              {
                path: 'diagnosis-eye-special',
                name: 'TicketClinicDiagnosisEyeSpecial',
                component: () =>
                  import('../views/ticket-clinic/detail/TicketClinicDiagnosisEyeSpecial.vue'),
                meta: { keepAlive: true, title: 'Đo thị lực' },
              },
              {
                path: 'procedure',
                name: 'TicketClinicProcedure',
                component: () =>
                  import('../views/ticket-clinic/detail/procedure/TicketClinicProcedure.vue'),
                meta: { keepAlive: true, title: 'Chỉ định dịch vụ' },
              },
              {
                path: 'laboratory',
                name: 'TicketClinicLaboratory',
                component: () =>
                  import('../views/ticket-clinic/detail/laboratory/TicketClinicLaboratory.vue'),
                meta: { keepAlive: true, title: 'Chỉ định Xét nghiệm' },
              },
              {
                path: 'radiology',
                name: 'TicketClinicRadiology',
                component: () =>
                  import('../views/ticket-clinic/detail/radiology/TicketClinicRadiology.vue'),
                meta: { keepAlive: true, title: 'Chỉ định CĐHA' },
              },
              {
                path: 'consumable',
                name: 'TicketClinicConsumable',
                component: () =>
                  import('../views/ticket-clinic/detail/consumable/TicketClinicConsumable.vue'),
                meta: { keepAlive: true, title: 'Vật tư' },
              },
              {
                path: 'prescription',
                name: 'TicketClinicPrescription',
                component: () =>
                  import('../views/ticket-clinic/detail/prescription/TicketClinicPrescription.vue'),
                meta: { keepAlive: true, title: 'Kê đơn thuốc' },
              },
              {
                path: 'user',
                name: 'TicketClinicUser',
                component: () => import('../views/ticket-clinic/detail/user/TicketClinicUser.vue'),
                meta: { title: 'Nhân viên và hoa hồng' },
              },
              {
                path: 'summary',
                name: 'TicketClinicSummary',
                component: () =>
                  import('../views/ticket-clinic/detail/summary/TicketClinicSummary.vue'),
                meta: { title: 'Tổng kết' },
              },
            ],
          },
        ],
      },
    ],
  },
]
