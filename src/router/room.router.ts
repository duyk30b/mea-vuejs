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
      path: 'room-ticket-reception/:roomId',
      name: 'RoomTicketReception',
      component: () => import('../views/room/room-ticket-reception/list/TicketReceptionList.vue'),
      meta: {
        menuKey: (route: RouteLocationNormalizedLoaded, params: { roomId: any }) => {
          return route.name?.toString() + '_' + params?.roomId
        },
      },
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
          component: () => import('../views/room/room-ticket-order/detail/TicketOrderDetailContainer.vue'),
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
                import('../views/room/room-ticket-clinic/detail/TicketClinicDiagnosis.vue'),
              meta: { keepAlive: true, title: 'Khám' },
            },
            {
              path: 'diagnosis-obstetrics',
              name: 'TicketClinicDiagnosisObstetric',
              component: () =>
                import(
                  '../views/room/room-ticket-clinic/detail/diagnosis/TicketClinicDiagnosisObstetric.vue'
                ),
              meta: { keepAlive: true, title: 'Khám' },
            },
            {
              path: 'diagnosis-eye-basic',
              name: 'TicketClinicDiagnosisEyeBasic',
              component: () =>
                import(
                  '../views/room/room-ticket-clinic/detail/diagnosis/TicketClinicDiagnosisEyeBasic.vue'
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
              name: 'TicketClinicProcedure',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/TicketClinicProcedure.vue'),
              meta: { keepAlive: true, title: 'Chỉ định dịch vụ' },
            },
            {
              path: 'laboratory',
              name: 'TicketClinicLaboratory',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/TicketClinicLaboratory.vue'),
              meta: { keepAlive: true, title: 'Chỉ định Xét nghiệm' },
            },
            {
              path: 'radiology',
              name: 'TicketClinicRadiology',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/TicketClinicRadiology.vue'),
              meta: { keepAlive: true, title: 'Chỉ định CĐHA' },
            },
            {
              path: 'consumable',
              name: 'TicketClinicConsumable',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/TicketClinicConsumable.vue'),
              meta: { keepAlive: true, title: 'Vật tư' },
            },
            {
              path: 'prescription',
              name: 'TicketClinicPrescription',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/TicketClinicPrescription.vue'),
              meta: { keepAlive: true, title: 'Kê đơn thuốc' },
            },
            {
              path: 'summary',
              name: 'TicketClinicSummary',
              component: () =>
                import('../views/room/room-ticket-clinic/detail/TicketClinicSummary.vue'),
              meta: { title: 'Tổng kết' },
            },
          ],
        },
      ],
    },
    {
      path: 'room-ticket-spa/:roomId',
      name: 'RoomTicketSpa',
      component: () => import('../views/room/room-ticket-spa/RoomTicketSpa.vue'),
      redirect: () => ({ name: 'TicketSpaList' }),
      meta: {
        menuKey: (route: RouteLocationNormalizedLoaded, params: { roomId: any }) => {
          return route.name?.toString() + '_' + params?.roomId
        },
      },
      children: [
        {
          path: 'ticket-list',
          name: 'TicketSpaList',
          component: () => import('../views/room/room-ticket-spa/list/TicketSpaList.vue'),
        },
        {
          path: 'ticket-detail/:ticketId',
          name: 'TicketSpaDetailContainer',
          component: () =>
            import('../views/room/room-ticket-spa/detail/TicketSpaDetailContainer.vue'),
          redirect: () => {
            return { name: 'TicketSpaDiagnosis' }
          },
          children: [
            {
              path: 'diagnosis',
              name: 'TicketSpaDiagnosis',
              component: () =>
                import('../views/room/room-ticket-spa/detail/TicketSpaDiagnosis.vue'),
              meta: { keepAlive: true, title: 'Khám' },
            },
            {
              path: 'procedure',
              name: 'TicketSpaProcedure',
              component: () =>
                import('../views/room/room-ticket-spa/detail/TicketSpaProcedure.vue'),
              meta: { keepAlive: true, title: 'Dịch vụ' },
            },
            {
              path: 'product',
              name: 'TicketSpaProduct',
              component: () => import('../views/room/room-ticket-spa/detail/TicketSpaProduct.vue'),
              meta: { keepAlive: true, title: 'Vật tư' },
            },
            {
              path: 'summary',
              name: 'TicketSpaSummary',
              component: () => import('../views/room/room-ticket-spa/detail/TicketSpaSummary.vue'),
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
