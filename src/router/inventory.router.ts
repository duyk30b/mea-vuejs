import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

export const inventoryRouter: RouteRecordRaw = {
  path: 'inventory',
  name: 'Inventory',
  meta: { title: 'Kho hàng' },
  redirect: () => ({ name: 'ProductList' }),
  children: [
    {
      path: 'product-list',
      name: 'ProductList',
      component: () => import('../views/product/list/ProductList.vue'),
      meta: { title: 'Sản phẩm' },
    },
    {
      path: 'delivery-ticket-list',
      name: 'DeliveryTicketList',
      component: () => import('../views/inventory/delivery/DeliveryTicketList.vue'),
      meta: { title: 'Chờ xuất hàng' },
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
      path: 'stock-check',
      name: 'StockCheck',
      meta: { title: 'Kiểm hàng' },
      redirect: () => ({ name: 'StockCheckList' }),
      children: [
        {
          path: 'list',
          name: 'StockCheckList',
          component: () => import('../views/stock-check/list/StockCheckList.vue'),
        },
        {
          path: 'detail/:id',
          name: 'StockCheckDetail',
          meta: { title: 'Thông tin kiểm hàng' },
          component: () => import('../views/stock-check/detail/StockCheckDetail.vue'),
        },
        {
          path: 'upsert/:id?',
          name: 'StockCheckUpsert',
          component: () => import('../views/stock-check/upsert/StockCheckUpsert.vue'),
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
