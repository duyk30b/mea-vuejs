import { useSettingStore } from '@/modules/_me/setting.store'
import { TicketType } from '@/modules/ticket'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const roomRouter: RouteRecordRaw = {
  path: 'room',
  name: 'Room',
  redirect: () => ({ name: 'RoomList' }),
  children: [
    {
      path: '',
      name: 'RoomList',
      meta: { title: 'Danh sách phòng' },
      component: () => import('../views/room/RoomList.vue'),
    },
    {
      path: 'room-ticket/:roomId',
      name: 'RoomTicket',
      component: () => import('../views/room/room-ticket/RoomTicket.vue'),
      redirect: () => ({ name: 'RoomTicketList' }),
      meta: {
        menuKey: (route: RouteLocationNormalizedLoaded, params: { roomId: any }) => {
          return route.name?.toString() + '_' + params?.roomId
        },
      },
      children: [
        {
          path: 'ticket-list',
          name: 'RoomTicketList',
          component: () => import('../views/room/room-ticket/room-ticket-list/RoomTicketList.vue'),
        },
        {
          path: 'ticket-clinic-detail/:ticketId',
          name: 'TicketClinicDetailContainer',
          component: () => import('../views/ticket-clinic/detail/TicketClinicDetailContainer.vue'),
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
                import('../views/ticket-clinic/detail/diagnosis/TicketClinicDiagnosisGeneral.vue'),
              meta: { keepAlive: true, title: 'Khám' },
            },
            {
              path: 'diagnosis-obstetrics',
              name: 'TicketClinicDiagnosisObstetric',
              component: () =>
                import(
                  '../views/ticket-clinic/detail/diagnosis/TicketClinicDiagnosisObstetric.vue'
                ),
              meta: { keepAlive: true, title: 'Khám' },
            },
            {
              path: 'diagnosis-eye-basic',
              name: 'TicketClinicDiagnosisEyeBasic',
              component: () =>
                import('../views/ticket-clinic/detail/diagnosis/TicketClinicDiagnosisEyeBasic.vue'),
              meta: { keepAlive: true, title: 'Khám' },
            },
            {
              path: 'diagnosis-eye-special',
              name: 'TicketClinicDiagnosisEyeSpecial',
              component: () =>
                import(
                  '../views/ticket-clinic/detail/diagnosis/TicketClinicDiagnosisEyeSpecial.vue'
                ),
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
    {
      path: 'room-product/:roomId',
      name: 'RoomProduct',
      component: () => import('../views/room/room-ticket/room-ticket-list/RoomTicketList.vue'),
    },
    {
      path: 'room-procedure/:roomId',
      name: 'RoomProcedure',
      component: () => import('../views/room/room-ticket/room-ticket-list/RoomTicketList.vue'),
    },
    {
      path: 'room-laboratory/:roomId',
      name: 'RoomLaboratory',
      component: () => import('../views/room/room-laboratory/RoomLaboratory.vue'),
      meta: {
        menuKey: (route: RouteLocationNormalizedLoaded, params: { roomId: any }) => {
          return route.name?.toString() + '_' + params?.roomId
        },
      },
    },
    {
      path: 'room-radiology/:roomId',
      name: 'RoomRadiology',
      component: () => import('../views/room/room-radiology/RoomRadiology.vue'),
      redirect: () => ({ name: 'TicketRadiologyList' }),
      meta: {
        menuKey: (route: RouteLocationNormalizedLoaded, params: { roomId: any }) => {
          return route.name?.toString() + '_' + params?.roomId
        },
      },
      children: [
        {
          path: 'ticket-radiology-list',
          name: 'TicketRadiologyList',
          component: () => import('../views/room/room-radiology/list/TicketRadiologyList.vue'),
        },
        {
          path: 'ticket-radiology/detail/:ticketRadiologyId',
          name: 'TicketRadiologyDetail',
          component: () => import('../views/room/room-radiology/detail/TicketRadiologyDetail.vue'),
        },
      ],
    },
  ],
}
