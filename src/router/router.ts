import { useUserStore } from '@/store/user.store'
import { createRouter, createWebHistory, type RouteLocationNormalizedLoaded } from 'vue-router'

enum AuthLevel {
	GUEST = 'guest',
	USER = 'user',
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
					path: 'arrival',
					name: 'Arrival',
					component: () => import('../views/arrival/Arrival.vue'),
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
							component: () => import('../views/invoice/InvoiceList.vue'),
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
							component: () => import('../views/customer/CustomerList.vue'),
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
									component: () => import('../views/product/ProductList.vue'),
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
									component: () => import('../views/receipt/ReceiptList.vue'),
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
									component: () => import('../views/distributor/DistributorList.vue'),
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
				// {
				// 	path: 'report',
				// 	name: 'Report',
				// 	meta: {
				// 		auth: AuthLevel.USER,
				// 		breadcrumb: 'Kho hàng',
				// 	},
				// 	component: () => import('../views/report/Report.vue'),
				// 	children: [
				// 		{
				// 			path: 'finance-report',
				// 			meta: { breadcrumb: 'Tồn kho' },
				// 			name: 'FinanceReport',
				// 			component: () => import('../views/report/FinanceReport.vue'),
				// 		},
				// 	],
				// },
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
							path: 'employee-info',
							name: 'EmployeeInfo',
							component: () => import('../views/systems/EmployeeInfo.vue'),
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
	const userStore = useUserStore()

	if (to.meta.auth === AuthLevel.USER && !userStore.userInfo) {
		return next({ name: 'Login' })
	}

	if (to.meta.auth === AuthLevel.GUEST && userStore.userInfo) {
		return next({ name: 'AppHome' })
	}

	return next()
})

export { Router }
