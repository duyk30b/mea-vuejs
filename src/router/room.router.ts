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
      path: 'appointment-list',
      name: 'AppointmentList',
      component: () => import('../views/room/appointment/list/AppointmentList.vue'),
      meta: { title: 'Hẹn khám' },
    },
    {
      path: 'reception-list',
      name: 'ReceptionList',
      component: () => import('../views/room/reception/list/TicketReceptionList.vue'),
      meta: { title: 'Tiếp đón' },
    },
    {
      path: 'room-ticket-order/:roomId',
      name: 'RoomTicketOrder',
      redirect: () => ({ name: 'TicketOrderList' }),
      meta: {
        menuKey: (route: RouteLocationNormalizedLoaded, params: { roomId: any }) => {
          return route.name?.toString() + '_' + params?.roomId
        },
      },
      children: [
        {
          path: 'list',
          name: 'TicketOrderList',

          component: () => import('../views/room/room-ticket-order/list/TicketOrderList.vue'),
        },
        {
          path: 'detail/:ticketId',
          name: 'TicketOrderDetailContainer',
          meta: { title: 'Thông tin đơn' },
          component: () =>
            import('../views/room/room-ticket-order/detail/TicketOrderDetailContainer.vue'),
        },
        {
          path: 'upsert/:ticketId?',
          name: 'TicketOrderUpsert',
          component: () => import('../views/room/room-ticket-order/upsert/TicketOrderUpsert.vue'),
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
      path: 'room-ticket-clinic/:roomId',
      name: 'RoomTicketClinic',
      component: () => import('../views/room/room-ticket-clinic/RoomTicketClinic.vue'),
      redirect: () => ({ name: 'TicketClinicList' }),
      meta: {
        menuKey: (route: RouteLocationNormalizedLoaded, params: { roomId: any }) => {
          return route.name?.toString() + '_' + params?.roomId
        },
      },
      children: [
        {
          path: 'ticket-list',
          name: 'TicketClinicList',
          component: () => import('../views/room/room-ticket-clinic/list/TicketClinicList.vue'),
        },
        {
          path: 'ticket-detail/:ticketId',
          name: 'TicketClinicDetailContainer',
          component: () =>
            import('../views/room/room-ticket-clinic/detail/TicketClinicDetailContainer.vue'),
          meta: { title: 'Khám bệnh' },
          redirect: () => ({ name: 'TicketClinicDiagnosis' }),
          children: [
            {
              path: 'diagnosis',
              name: 'TicketClinicDiagnosis',
              component: () =>
                import(
                  '../views/room/room-ticket-clinic/detail/diagnosis/TicketClinicDiagnosis.vue'
                ),
              meta: { keepAlive: true, title: 'Khám' },
            },
            {
              path: 'diagnosis-eye-special',
              name: 'TicketClinicDiagnosisEyeSpecial',
              component: () =>
                import(
                  '../views/room/room-ticket-clinic/detail/diagnosis/TicketClinicDiagnosisEyeSpecial.vue'
                ),
              meta: { keepAlive: true, title: 'Đo thị lực' },
            },
            {
              path: 'procedure',
              name: 'TicketClinicProcedureContainer',
              component: () =>
                import(
                  '../views/room/room-ticket-clinic/detail/procedure/TicketClinicProcedureContainer.vue'
                ),
              meta: { keepAlive: true, title: 'Chỉ định dịch vụ' },
            },
            {
              path: 'laboratory',
              name: 'TicketClinicLaboratoryContainer',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/laboratory/TicketClinicLaboratoryContainer.vue'),
              meta: { keepAlive: true, title: 'Chỉ định Xét nghiệm' },
            },
            {
              path: 'radiology',
              name: 'TicketClinicRadiologyContainer',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/radiology/TicketClinicRadiologyContainer.vue'),
              meta: { keepAlive: true, title: 'Chỉ định CĐHA' },
            },
            {
              path: 'consumable',
              name: 'TicketClinicConsumableContainer',
              component: () =>
                import(
                  '../views/room/room-ticket-clinic/detail/consumable/TicketClinicConsumableContainer.vue'
                ),
              meta: { keepAlive: true, title: 'Vật tư' },
            },
            {
              path: 'prescription',
              name: 'TicketClinicPrescriptionContainer',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/prescription/TicketClinicPrescriptionContainer.vue'),
              meta: { keepAlive: true, title: 'Kê đơn thuốc' },
            },
            {
              path: 'user',
              name: 'TicketClinicUserContainer',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/user/TicketClinicUserContainer.vue'),
              meta: { keepAlive: true, title: 'Nhân viên' },
            },
            {
              path: 'summary',
              name: 'TicketClinicSummaryContainer',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/summary/TicketClinicSummaryContainer.vue'),
              meta: { title: 'Tổng kết' },
            },
          ],
        },
      ],
    },
    {
      path: 'room-product/:roomId',
      name: 'RoomProduct',
      component: () => import('../views/room/room-ticket-clinic/list/TicketClinicList.vue'),
    },
    {
      path: 'room-procedure/:roomId',
      name: 'RoomProcedure',
      component: () => import('../views/room/room-ticket-clinic/list/TicketClinicList.vue'),
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
