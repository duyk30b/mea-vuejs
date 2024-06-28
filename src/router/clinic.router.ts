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
          name: 'VisitList',
          component: () => import('../views/visit/list/VisitList.vue'),
          meta: { title: 'Danh sách khám' },
        },
        {
          path: 'detail/:id',
          name: 'VisitDetail',
          component: () => import('../views/visit/detail/VisitDetailContainer.vue'),
          meta: { title: 'Khám bệnh' },
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