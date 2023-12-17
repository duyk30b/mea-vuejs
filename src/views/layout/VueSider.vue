<script setup lang="ts">
import {
  AppstoreOutlined,
  ContactsOutlined,
  NodeIndexOutlined,
  PicCenterOutlined,
  RocketOutlined,
  AreaChartOutlined,
  ScheduleOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ collapsed?: boolean }>()

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
    <a-sub-menu key="Invoice">
      <template #icon>
        <RocketOutlined />
      </template>
      <template #title> Hóa đơn </template>
      <a-menu-item key="InvoiceUpsert">
        <router-link :to="{ name: 'InvoiceUpsert' }"> Tạo hóa đơn </router-link>
      </a-menu-item>
      <a-menu-item key="InvoiceList">
        <router-link :to="{ name: 'InvoiceList' }"> Danh sách hóa đơn </router-link>
      </a-menu-item>
    </a-sub-menu>
    <!-- <a-menu-item key="ArrivalDiagnosis">
      <TeamOutlined /> <span>Khám bệnh</span>
    </a-menu-item> -->
    <a-menu-item key="Customer">
      <ContactsOutlined />
      <span>
        <router-link :to="{ name: 'Customer' }">Khách Hàng</router-link>
      </span>
    </a-menu-item>
    <!-- <a-sub-menu key="Reception">
      <template #icon>
        <TeamOutlined />
      </template>
      <template #title>Tiếp đón</template>
      <a-menu-item key="ReceptionNew">Đăng ký khám</a-menu-item>
      <a-menu-item key="ReceptionList">Danh sách khám</a-menu-item>
    </a-sub-menu> -->
    <a-sub-menu key="Warehouse">
      <template #icon>
        <ShopOutlined />
      </template>
      <template #title> Kho hàng </template>
      <a-menu-item key="Product">
        <router-link :to="{ name: 'Product' }"> Tồn kho </router-link>
      </a-menu-item>
      <a-menu-item key="Receipt">
        <router-link :to="{ name: 'Receipt' }"> Nhập hàng </router-link>
      </a-menu-item>
      <a-menu-item key="Distributor">
        <router-link :to="{ name: 'Distributor' }"> Nhà cung cấp </router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-menu-item key="Procedure">
      <PicCenterOutlined />
      <span>
        <router-link :to="{ name: 'Procedure' }">Dịch vụ</router-link>
      </span>
    </a-menu-item>
    <a-sub-menu key="Statistic">
      <template #icon>
        <AreaChartOutlined />
      </template>
      <template #title> Thống kê </template>
      <a-menu-item key="StatisticProduct">
        <router-link :to="{ name: 'StatisticProduct' }"> Báo cáo kho </router-link>
      </a-menu-item>
      <a-menu-item key="StatisticProcedure">
        <router-link :to="{ name: 'StatisticProcedure' }"> Báo cáo dịch vụ </router-link>
      </a-menu-item>
      <a-menu-item key="StatisticCustomer">
        <router-link :to="{ name: 'StatisticCustomer' }"> Báo cáo khách hàng </router-link>
      </a-menu-item>
      <a-menu-item key="StatisticOrder">
        <router-link :to="{ name: 'StatisticOrder' }"> Báo cáo đơn hàng </router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu key="Systems">
      <template #icon>
        <SettingOutlined />
      </template>
      <template #title> Hệ thống </template>
      <a-menu-item key="OrganizationInfo">
        <router-link :to="{ name: 'OrganizationInfo' }"> Thông tin cơ sở </router-link>
      </a-menu-item>
      <a-menu-item key="EmployeeInfo">
        <router-link :to="{ name: 'EmployeeInfo' }"> Thông tin cá nhân </router-link>
      </a-menu-item>
      <a-menu-item key="SystemSetting">
        <router-link :to="{ name: 'SystemSetting' }"> Cài đặt </router-link>
      </a-menu-item>
    </a-sub-menu>
  </a-menu>
</template>
