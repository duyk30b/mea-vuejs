import type { RouteRecordRaw } from 'vue-router'

export const statisticRouter: RouteRecordRaw = {
  path: 'statistic',
  name: 'Statistic',
  redirect: () => ({ name: 'StatisticOverview' }),
  component: () => import('../views/statistic/Statistics.vue'),
  meta: { title: 'Thống kê' },
  children: [
    {
      meta: { title: 'Tổng quan' },
      path: 'statistic-overview',
      name: 'StatisticOverview',
      component: () => import('../views/statistic/statistic-overview/StatisticOverview.vue'),
    },
    {
      path: 'statistic-distributor',
      meta: { title: 'Báo cáo nhà cung cấp' },
      name: 'StatisticDistributor',
      component: () => import('../views/statistic/statistic-distributor/StatisticDistributor.vue'),
    },
    {
      path: 'statistic-customer',
      meta: { title: 'Báo cáo khách hàng' },
      name: 'StatisticCustomer',
      component: () => import('../views/statistic/statistic-customer/StatisticCustomer.vue'),
    },
    {
      path: 'statistic-product',
      meta: { title: 'Báo cáo sản phẩm' },
      name: 'StatisticProduct',
      component: () => import('../views/statistic/statistic-product/StatisticProduct.vue'),
    },
    {
      path: 'statistic-procedure',
      meta: { title: 'Báo cáo dịch vụ' },
      name: 'StatisticProcedure',
      component: () => import('../views/statistic/statistic-procedure/StatisticProcedure.vue'),
    },
    {
      path: 'statistic-laboratory',
      meta: { title: 'Báo cáo xét nghiệm' },
      name: 'StatisticLaboratory',
      component: () => import('../views/statistic/statistic-laboratory/StatisticLaboratory.vue'),
    },
    {
      path: 'statistic-radiology',
      meta: { title: 'Báo cáo CĐHA' },
      name: 'StatisticRadiology',
      component: () => import('../views/statistic/statistic-radiology/StatisticRadiology.vue'),
    },
  ],
}
