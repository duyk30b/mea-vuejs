import type { RouteRecordRaw } from 'vue-router'

export const dataRouter: RouteRecordRaw = {
  path: 'data',
  name: 'Data',
  children: [
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
    {
      path: 'procedure',
      name: 'Procedure',
      redirect: () => ({ name: 'ProcedureList' }),
      children: [
        {
          path: 'list',
          name: 'ProcedureList',
          component: () => import('../views/procedure/ProcedureList.vue'),
          meta: { title: 'Dịch vụ' },
        },
      ],
    },
  ],
}
