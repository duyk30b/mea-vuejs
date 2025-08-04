import type { RouteRecordRaw } from 'vue-router'

export const statisticRouter: RouteRecordRaw = {
  path: 'statistic',
  name: 'Statistic',
  redirect: () => ({ name: 'StatisticTicket' }),
  component: () => import('../views/statistic/Statistics.vue'),
  meta: { title: 'Thống kê' },
  children: [
    {
      meta: { title: 'Thống kê' },
      path: 'statistic-ticket',
      name: 'StatisticTicket',
      component: () => import('../views/statistic/statistic-ticket/StatisticTicket.vue'),
    },
    {
      path: 'statistic-product',
      meta: { title: 'Báo cáo sản phẩm' },
      name: 'StatisticProduct',
      component: () => import('../views/statistic/statistic-product/StatisticProduct.vue'),
    },
    {
      path: 'statistic-customer',
      meta: { title: 'Thống kê' },
      name: 'StatisticCustomer',
      component: () => import('../views/statistic/statistic-customer/StatisticCustomer.vue'),
    },
    {
      path: 'statistic-procedure',
      meta: { title: 'Thống kê' },
      name: 'StatisticProcedure',
      component: () => import('../views/statistic/statistic-procedure/StatisticProcedure.vue'),
    },
    {
      path: 'statistic-laboratory',
      meta: { title: 'Thống kê' },
      name: 'StatisticLaboratory',
      component: () => import('../views/statistic/statistic-laboratory/StatisticLaboratory.vue'),
    },
    {
      path: 'statistic-radiology',
      meta: { title: 'Thống kê' },
      name: 'StatisticRadiology',
      component: () => import('../views/statistic/statistic-radiology/StatisticRadiology.vue'),
    },
  ],
}
