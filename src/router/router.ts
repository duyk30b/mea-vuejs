import { createRouter, createWebHistory, type RouteLocationNormalizedLoaded } from 'vue-router'
import { MeService } from '../modules/_me/me.service'
import { AuthService } from '../modules/auth/auth.service'
import { inventoryRouter } from './inventory.router'
import { masterDataRouter } from './master-data.router'
import { receptionRouter } from './reception.router'
import { roomRouter } from './room.router'
import { statisticRouter } from './statistic.router'
import { ticketRouter } from './ticket.router'

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
        receptionRouter,
        roomRouter,
        ...ticketRouter,
        inventoryRouter,
        masterDataRouter,
        statisticRouter,
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
          path: 'user',
          name: 'User',
          children: [
            {
              path: 'account',
              meta: { title: 'Tài khoản' },
              name: 'Account',
              component: () => import('../views/user/account/AccountList.vue'),
            },
            {
              path: 'role',
              name: 'Role',
              meta: { title: 'Vai trò' },
              redirect: () => ({ name: 'RoleList' }),
              children: [
                {
                  path: 'list',
                  name: 'RoleList',
                  component: () => import('../views/user/role/RoleList.vue'),
                },
                {
                  path: 'upsert/:id?',
                  name: 'RoleUpsert',
                  component: () => import('../views/user/role/upsert/RoleUpsertContainer.vue'),
                  meta: {
                    title: (route: RouteLocationNormalizedLoaded) => {
                      if (route.params.id) return 'Cập nhật vai trò'
                      return 'Tạo mới vai trò'
                    },
                  },
                },
              ],
            },
            {
              path: 'position',
              meta: { title: 'Vị trí' },
              name: 'Position',
              component: () => import('../views/user/position/list/PositionList.vue'),
            },
          ],
        },
        {
          path: 'finance',
          name: 'Finance',
          children: [
            {
              path: 'payment-list',
              name: 'PaymentList',
              component: () => import('../views/finance/payment/PaymentList.vue'),
              meta: { title: 'Thu chi' },
            },
            {
              path: 'finance-ticket-list',
              name: 'FinanceTicketList',
              component: () => import('../views/finance/finance-ticket/FinanceTicketList.vue'),
              meta: { title: 'Phòng thu ngân' },
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
              component: () => import('../views/systems/setting/SettingSystemContainer.vue'),
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
              path: 'data',
              name: 'RootData',
              component: () => import('../views/root/RootData.vue'),
              meta: { title: 'Data' },
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
    {
      path: '/privacy',
      component: () => import('../views/AppPrivacy.vue'),
    },
    {
      path: '/term',
      component: () => import('../views/AppTerm.vue'),
    },
    // Route bắt tất cả và redirect về trang chủ
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

Router.beforeEach((to, from, next) => {
  const { user } = MeService

  // if (to.meta.auth === AuthLevel.ROOT && meStore.user?.oid !== 0) {
  //   AuthService.logout()
  //   return next({ name: 'Login' })
  // }

  if (to.meta.auth === AuthLevel.USER && !user.value) {
    AuthService.logout()
    return next({ name: 'Login' })
  }

  if (to.meta.auth === AuthLevel.GUEST && user.value) {
    return next({ name: 'AppHome' })
  }

  return next()
})

export { Router }
