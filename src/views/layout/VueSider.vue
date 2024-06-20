<script setup lang="ts">
import {
  ApartmentOutlined,
  AppstoreOutlined,
  AreaChartOutlined,
  ContactsOutlined,
  PicCenterOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import InvoiceIcon from '../../common/icon/InvoiceIcon.vue'
import MedicalIcon from '../../common/icon/MedicalIcon.vue'
import StoreIcon from '../../common/icon/StoreIcon.vue'
import { useMeStore } from '../../modules/_me/me.store'
import { PermissionId } from '../../modules/permission/permission.enum'

const props = defineProps<{ collapsed?: boolean }>()
const meStore = useMeStore()
const { permissionIdMap } = meStore

const emit = defineEmits(['handleShowDrawer'])
const router = useRouter()

const openKeys = ref<string[]>([])
const selectedKeys = ref<string[]>([])

watchEffect(() => {
  const openRouterName = router.currentRoute.value.matched.slice(1).map((i) => i.name) // slice 1 vì vị trí 0 là Home
  selectedKeys.value = openRouterName as string[]
  if (props.collapsed === false) {
    openKeys.value = openRouterName as string[]
  }
})

const handleMenuClick = (menu: { key: string; keyPath: string[] }) => {
  // router.push({ name: menu.key, params: {} })
  openKeys.value = menu.keyPath
  emit('handleShowDrawer', false)
}
</script>

<template>
  <a-menu
    v-model:selectedKeys="selectedKeys"
    theme="light"
    mode="inline"
    :inline-collapsed="false"
    :openKeys="openKeys"
    @click="handleMenuClick"
  >
    <a-menu-item key="AppHome">
      <AppstoreOutlined />
      <span>
        <router-link :to="{ name: 'AppHome' }">Home</router-link>
      </span>
    </a-menu-item>
    <a-menu-item v-if="permissionIdMap[PermissionId.VISIT_READ]" key="Visit">
      <template #icon>
        <MedicalIcon />
      </template>
      <span>
        <router-link :to="{ name: 'Visit' }">Phòng khám</router-link>
      </span>
    </a-menu-item>
    <a-sub-menu v-if="permissionIdMap[PermissionId.INVOICE_READ]" key="Invoice">
      <template #icon>
        <InvoiceIcon />
      </template>
      <template #title> Bán hàng </template>
      <a-menu-item v-if="permissionIdMap[PermissionId.INVOICE_CREATE_DRAFT]" key="InvoiceUpsert">
        <router-link :to="{ name: 'InvoiceUpsert' }"> Tạo hóa đơn </router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.INVOICE_READ]" key="InvoiceList">
        <router-link :to="{ name: 'InvoiceList' }"> Danh sách hóa đơn </router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-menu-item v-if="permissionIdMap[PermissionId.CUSTOMER_READ]" key="Customer">
      <ContactsOutlined />
      <span>
        <router-link :to="{ name: 'Customer' }">Khách hàng</router-link>
      </span>
    </a-menu-item>
    <a-sub-menu
      v-if="
        permissionIdMap[PermissionId.PRODUCT_READ] ||
        permissionIdMap[PermissionId.RECEIPT_READ] ||
        permissionIdMap[PermissionId.DISTRIBUTOR_READ]
      "
      key="Warehouse"
    >
      <template #icon>
        <StoreIcon />
      </template>
      <template #title> Kho hàng </template>
      <a-menu-item v-if="permissionIdMap[PermissionId.PRODUCT_READ]" key="Product">
        <router-link :to="{ name: 'Product' }"> Tồn kho </router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.RECEIPT_READ]" key="Receipt">
        <router-link :to="{ name: 'Receipt' }"> Nhập hàng </router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.DISTRIBUTOR_READ]" key="Distributor">
        <router-link :to="{ name: 'Distributor' }"> Nhà cung cấp </router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-menu-item v-if="permissionIdMap[PermissionId.PROCEDURE_READ]" key="Procedure">
      <PicCenterOutlined />
      <span>
        <router-link :to="{ name: 'Procedure' }">Dịch vụ</router-link>
      </span>
    </a-menu-item>
    <a-sub-menu
      v-if="
        permissionIdMap[PermissionId.STATISTIC_PRODUCT] ||
        permissionIdMap[PermissionId.STATISTIC_PROCEDURE] ||
        permissionIdMap[PermissionId.STATISTIC_CUSTOMER] ||
        (permissionIdMap[PermissionId.STATISTIC_RECEIPT] &&
          permissionIdMap[PermissionId.STATISTIC_INVOICE])
      "
      key="Statistic"
    >
      <template #icon>
        <AreaChartOutlined />
      </template>
      <template #title> Thống kê </template>
      <a-menu-item v-if="permissionIdMap[PermissionId.STATISTIC_PRODUCT]" key="StatisticProduct">
        <router-link :to="{ name: 'StatisticProduct' }"> Báo cáo kho </router-link>
      </a-menu-item>
      <a-menu-item
        v-if="permissionIdMap[PermissionId.STATISTIC_PROCEDURE]"
        key="StatisticProcedure"
      >
        <router-link :to="{ name: 'StatisticProcedure' }"> Báo cáo dịch vụ </router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.STATISTIC_CUSTOMER]" key="StatisticCustomer">
        <router-link :to="{ name: 'StatisticCustomer' }"> Báo cáo khách hàng </router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.STATISTIC_INVOICE]" key="StatisticInvoice">
        <router-link :to="{ name: 'StatisticInvoice' }"> Báo cáo bán hàng </router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.STATISTIC_VISIT]" key="StatisticVisit">
        <router-link :to="{ name: 'StatisticVisit' }"> Báo cáo khám bệnh </router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu
      v-if="permissionIdMap[PermissionId.ROLE_READ] || permissionIdMap[PermissionId.USER_READ]"
      key="Account"
    >
      <template #icon>
        <TeamOutlined />
      </template>
      <template #title> Nhân viên </template>
      <a-menu-item v-if="permissionIdMap[PermissionId.ROLE_READ]" key="Role">
        <router-link :to="{ name: 'Role' }"> Vai trò </router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.USER_READ]" key="User">
        <router-link :to="{ name: 'User' }"> Tài khoản </router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu key="Systems">
      <template #icon>
        <SettingOutlined />
      </template>
      <template #title> Hệ thống </template>
      <a-menu-item
        v-if="permissionIdMap[PermissionId.ORGANIZATION_UPDATE_INFO]"
        key="OrganizationInfo"
      >
        <router-link :to="{ name: 'OrganizationInfo' }"> Thông tin cơ sở </router-link>
      </a-menu-item>
      <a-menu-item key="UserInfo">
        <router-link :to="{ name: 'UserInfo' }"> Thông tin cá nhân </router-link>
      </a-menu-item>
      <a-menu-item
        v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
        key="SystemSetting"
      >
        <router-link :to="{ name: 'SystemSetting' }"> Cài đặt </router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu v-if="meStore.user?.oid === 0" key="ROOT">
      <template #icon>
        <ApartmentOutlined />
      </template>
      <template #title> ROOT </template>
      <a-menu-item key="RootOrganizationList">
        <router-link :to="{ name: 'RootOrganizationList' }"> Organization </router-link>
      </a-menu-item>
      <a-menu-item key="RootUserList">
        <router-link :to="{ name: 'RootUserList' }"> User </router-link>
      </a-menu-item>
      <a-menu-item key="RootPermissionList">
        <router-link :to="{ name: 'RootPermissionList' }"> Permission </router-link>
      </a-menu-item>
    </a-sub-menu>
  </a-menu>
</template>
