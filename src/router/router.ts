import { createRouter, createWebHistory, type RouteLocationNormalizedLoaded } from 'vue-router'
import { useMeStore } from '../modules/_me/me.store'
import { AuthService } from '../modules/auth/auth.service'

enum AuthLevel {
  GUEST = 'GUEST',
  USER = 'USER',
  ROOT = 'ROOT',
}

const Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'AppContainer',
      component: () => import('../views/AppContainer.vue'),
      meta: { auth: AuthLevel.USER },
      children: [
        {
          path: '',
          name: 'AppHome',
          component: () => import('../views/AppHome.vue'),
          meta: { title: 'Trang chủ' },
        },
        {
          path: 'visit',
          name: 'Visit',
          redirect: () => ({ name: 'VisitList' }),
          children: [
            {
              path: 'visit-list',
              name: 'VisitList',
              meta: { title: 'Phòng khám' },
              component: () => import('../views/visit/list/VisitList.vue'),
            },
            {
              path: 'visit-detail/:id',
              name: 'VisitDetail',
              meta: { title: 'Khám bệnh' },
              component: () => import('../views/visit/detail/VisitDetail.vue'),
            },
          ],
        },
        {
          path: 'invoice',
          name: 'Invoice',
          redirect: () => ({ name: 'InvoiceList' }),
          children: [
            {
              path: 'list',
              name: 'InvoiceList',
              meta: { title: 'Hóa đơn' },
              component: () => import('../views/invoice/list/InvoiceList.vue'),
            },
            {
              path: 'detail/:id',
              name: 'InvoiceDetail',
              meta: { title: 'Hóa đơn' },
              component: () => import('../views/invoice/detail/InvoiceDetail.vue'),
            },
            {
              path: 'upsert/:id?',
              name: 'InvoiceUpsert',
              component: () => import('../views/invoice/upsert/InvoiceUpsert.vue'),
              meta: {
                title: (route: RouteLocationNormalizedLoaded) => {
                  if (route.query?.mode === 'UPDATE') return 'Hóa đơn'
                  return 'Hóa đơn'
                },
              },
            },
          ],
        },
        {
          path: 'customer',
          name: 'Customer',
          redirect: () => ({ name: 'CustomerList' }),
          children: [
            {
              path: 'list',
              name: 'CustomerList',
              meta: { title: 'Khách Hàng' },
              component: () => import('../views/customer/list/CustomerList.vue'),
            },
          ],
        },
        {
          path: 'warehouse',
          name: 'Warehouse',
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
        {
          path: 'statistic',
          name: 'Statistic',
          redirect: () => ({ name: 'StatisticInvoice' }),
          component: () => import('../views/statistic/Statistics.vue'),
          children: [
            {
              path: 'statistic-product',
              meta: { title: 'Thống kê' },
              name: 'StatisticProduct',
              component: () => import('../views/statistic/statistic-product/StatisticProduct.vue'),
            },
            {
              path: 'statistic-procedure',
              meta: { title: 'Thống kê' },
              name: 'StatisticProcedure',
              component: () =>
                import('../views/statistic/statistic-procedure/StatisticProcedure.vue'),
            },
            {
              path: 'statistic-customer',
              meta: { title: 'Thống kê' },
              name: 'StatisticCustomer',
              component: () =>
                import('../views/statistic/statistic-customer/StatisticCustomer.vue'),
            },
            {
              path: 'statistic-invoice',
              meta: { title: 'Thống kê' },
              name: 'StatisticInvoice',
              component: () => import('../views/statistic/statistic-invoice/StatisticInvoice.vue'),
            },
            {
              path: 'statistic-visit',
              meta: { title: 'Thống kê' },
              name: 'StatisticVisit',
              component: () => import('../views/statistic/statistic-visit/StatisticVisit.vue'),
            },
          ],
        },
        {
          path: 'account',
          name: 'Account',
          children: [
            {
              path: 'user',
              meta: { title: 'Nhân viên' },
              name: 'User',
              component: () => import('../views/user/UserList.vue'),
            },
            {
              path: 'role',
              name: 'Role',
              redirect: () => ({ name: 'RoleList' }),
              children: [
                {
                  path: 'list',
                  name: 'RoleList',
                  component: () => import('../views/role/RoleList.vue'),
                  meta: { title: 'Vai trò' },
                },
                {
                  path: 'upsert/:id?',
                  name: 'RoleUpsert',
                  component: () => import('../views/role/RoleUpsert.vue'),
                  meta: {
                    title: (route: RouteLocationNormalizedLoaded) => {
                      if (route.query?.mode === 'UPDATE') return 'Cập nhật vai trò'
                      return 'Tạo mới vai trò'
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          path: 'systems',
          name: 'Systems',
          children: [
            {
              path: 'organization-info',
              name: 'OrganizationInfo',
              component: () => import('../views/systems/OrganizationInfo.vue'),
              meta: { title: 'Hệ thống' },
            },
            {
              path: 'user-info',
              name: 'UserInfo',
              component: () => import('../views/systems/UserInfo.vue'),
              meta: { title: 'Hệ thống' },
            },
            {
              path: 'setting',
              name: 'SystemSetting',
              component: () => import('../views/systems/SystemSetting.vue'),
              meta: { title: 'Hệ thống' },
            },
          ],
        },
        {
          path: '/root',
          name: 'ROOT',
          meta: { auth: AuthLevel.ROOT },
          children: [
            {
              path: 'organization',
              name: 'RootOrganization',
              redirect: () => ({ name: 'RootOrganizationList' }),
              children: [
                {
                  path: 'list',
                  name: 'RootOrganizationList',
                  component: () => import('../views/root/RootOrganizationList.vue'),
                  meta: { title: 'Organization' },
                },
              ],
            },
            {
              path: 'user',
              name: 'RootUser',
              redirect: () => ({ name: 'RootUserList' }),
              children: [
                {
                  path: 'list',
                  name: 'RootUserList',
                  component: () => import('../views/root/RootUserList.vue'),
                  meta: { title: 'User' },
                },
              ],
            },
            {
              path: 'permission',
              name: 'RootPermission',
              redirect: () => ({ name: 'RootPermissionList' }),
              children: [
                {
                  path: 'list',
                  name: 'RootPermissionList',
                  component: () => import('../views/root/RootPermissionList.vue'),
                  meta: { title: 'Permission' },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: '/auth',
      meta: { auth: AuthLevel.GUEST },
      component: () => import('../views/auth/AuthContainer.vue'),
      children: [
        {
          path: 'register',
          name: 'Register',
          component: () => import('../views/auth/Register.vue'),
        },
        {
          path: 'login',
          name: 'Login',
          component: () => import('../views/auth/Login.vue'),
        },
        {
          path: 'forgot-password',
          name: 'ForgotPassword',
          component: () => import('../views/auth/ForgotPassword.vue'),
        },
        {
          path: 'reset-password',
          name: 'ResetPassword',
          component: () => import('../views/auth/ResetPassword.vue'),
        },
      ],
    },
  ],
})

Router.beforeEach((to, from, next) => {
  const meStore = useMeStore()

  // if (to.meta.auth === AuthLevel.ROOT && meStore.user?.oid !== 0) {
  //   AuthService.logout()
  //   return next({ name: 'Login' })
  // }

  if (to.meta.auth === AuthLevel.USER && !meStore.user) {
    AuthService.logout()
    return next({ name: 'Login' })
  }

  if (to.meta.auth === AuthLevel.GUEST && meStore.user) {
    return next({ name: 'AppHome' })
  }

  return next()
})

export { Router }
