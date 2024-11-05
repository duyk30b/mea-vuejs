import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const warehouseRouter: RouteRecordRaw = {
  path: 'goods',
  name: 'Goods',
  redirect: () => ({ name: 'ProductList' }),
  children: [
    {
      path: 'product',
      name: 'Product',
      redirect: () => ({ name: 'ProductList' }),
      children: [
        {
          path: 'list',
          name: 'ProductList',
          component: () => import('../views/product/list/ProductList.vue'),
          meta: { title: 'Tồn kho' },
        },
      ],
    },
    {
      path: 'receipt',
      name: 'Receipt',
      redirect: () => ({ name: 'ReceiptList' }),
      children: [
        {
          path: 'list',
          name: 'ReceiptList',
          component: () => import('../views/receipt/list/ReceiptList.vue'),
          meta: { title: 'Nhập hàng' },
        },
        {
          path: 'detail/:id',
          name: 'ReceiptDetail',
          component: () => import('../views/receipt/detail/ReceiptDetail.vue'),
          meta: { title: 'Nhập hàng' },
        },
        {
          path: 'upsert/:id?',
          name: 'ReceiptUpsert',
          component: () => import('../views/receipt/upsert/ReceiptUpsert.vue'),
          meta: {
            title: (route: RouteLocationNormalizedLoaded) => {
              if (route.query?.mode === 'UPDATE') return 'Nhập hàng'
              return 'Nhập hàng'
            },
          },
        },
      ],
    },
    {
      path: 'distributor',
      name: 'Distributor',
      redirect: () => ({ name: 'DistributorList' }),
      children: [
        {
          path: 'list',
          name: 'DistributorList',
          component: () => import('../views/distributor/list/DistributorList.vue'),
          meta: { title: 'Nhà cung cấp' },
        },
      ],
    },
  ],
}