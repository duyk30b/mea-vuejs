import type { RouteRecordRaw } from 'vue-router'

export const clinicRouter: RouteRecordRaw = {
  path: 'clinic',
  name: 'Clinic',
  children: [
    {
      path: 'visit',
      name: 'Visit',
      redirect: () => ({ name: 'VisitList' }),
      children: [
        {
          path: 'list',
          name: 'ClinicVisitList',
          component: () => import('../views/clinic/list/ClinicVisitList.vue'),
          meta: { title: 'Danh sách khám' },
        },
        {
          path: 'detail/:id',
          name: 'ClinicDetailContainer',
          component: () => import('../views/clinic/detail/ClinicDetailContainer.vue'),
          meta: { title: 'Khám bệnh' },
          children: [
            {
              path: 'diagnosis',
              name: 'ClinicDiagnosis',
              component: () => import('../views/clinic/detail/ClinicDiagnosis.vue'),
              meta: { keepAlive: true, title: 'Chẩn đoán' },
            },
            {
              path: 'procedure',
              name: 'ClinicProcedure',
              component: () => import('../views/clinic/detail/ClinicProcedure.vue'),
              meta: { keepAlive: true, title: 'Chỉ định dịch vụ' },
            },
            {
              path: 'radiology',
              name: 'ClinicRadiology',
              component: () => import('../views/clinic/detail/ClinicRadiology.vue'),
              meta: { keepAlive: true, title: 'Chỉ định CĐHA' },
            },
            {
              path: 'prescription',
              name: 'ClinicPrescription',
              component: () => import('../views/clinic/detail/ClinicPrescription.vue'),
              meta: { keepAlive: true, title: 'Kê đơn thuốc' },
            },
            {
              path: 'summary',
              name: 'ClinicSummary',
              component: () => import('../views/clinic/detail/ClinicSummary.vue'),
              meta: { title: 'Tổng kết' },
            },
          ],
        },
      ],
    },
    {
      path: 'radiology',
      name: 'Radiology',
      redirect: () => ({ name: 'RadiologyList' }),
      children: [
        {
          path: 'list',
          name: 'RadiologyList',
          component: () => import('../views/radiology/RadiologyList.vue'),
          meta: { title: 'Chẩn đoán hình ảnh' },
        },
      ],
    },
  ],
}
