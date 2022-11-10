import { useUserStore } from '@/store/user.store'
import { createRouter, createWebHistory } from 'vue-router'

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
				},
				{
					path: 'arrival-invoice',
					name: 'ArrivalInvoice',
					redirect: () => ({ name: 'ArrivalInvoiceList' }),
					children: [
						{
							path: 'list',
							name: 'ArrivalInvoiceList',
							component: () => import('../views/arrival-invoice/ArrivalInvoiceList.vue'),
						},
						{
							path: 'detail/:id',
							name: 'ArrivalInvoiceDetail',
							component: () => import('../views/arrival-invoice/details/ArrivalInvoiceDetails.vue'),
						},
						{
							path: 'invoice-upsert/:id?',
							name: 'ArrivalInvoiceUpsert',
							component: () => import('../views/arrival-invoice/upsert/ArrivalInvoiceUpsert.vue'),
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
								},
							],
						},
						{
							path: 'purchase-receipt',
							name: 'PurchaseReceipt',
							redirect: () => ({ name: 'PurchaseReceiptList' }),
							children: [
								{
									path: 'list',
									name: 'PurchaseReceiptList',
									component: () => import('../views/purchase/PurchaseReceiptList.vue'),
								},
								{
									path: 'detail/:id',
									name: 'PurchaseReceiptDetails',
									component: () => import('../views/purchase/details/PurchaseReceiptDetails.vue'),
								},
								{
									path: 'receipt-upsert/:id?',
									name: 'PurchaseReceiptUpsert',
									component: () => import('../views/purchase/upsert/PurchaseReceiptUpsert.vue'),
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
						},
						{
							path: 'employee-info',
							name: 'EmployeeInfo',
							component: () => import('../views/systems/EmployeeInfo.vue'),
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
