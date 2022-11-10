<script setup lang="ts">
import {
  AppstoreOutlined, ContactsOutlined,
  NodeIndexOutlined,
  PicCenterOutlined,
  RocketOutlined,
  ScheduleOutlined, SettingOutlined, ShopOutlined, TeamOutlined,
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

const handleMenuClick = (menu: { key: string }) => {
  router.push({ name: menu.key, params: {} })
  emit('handleShowDrawer', false)
}

</script>

<template>
  <a-menu theme="light" mode="inline" v-model:selectedKeys="selectedKeys" @click="handleMenuClick"
    :inline-collapsed="false" :openKeys=openKeys>
    <a-menu-item key="AppHome">
      <AppstoreOutlined />
      <span>Home</span>
    </a-menu-item>
    <a-sub-menu key="ArrivalInvoice">
      <template #icon>
        <RocketOutlined />
      </template>
      <template #title>Tiếp đón nhanh</template>
      <a-menu-item key="ArrivalInvoiceUpsert">Tiếp đón mới</a-menu-item>
      <a-menu-item key="ArrivalInvoiceList">Danh sách tiếp đón</a-menu-item>
    </a-sub-menu>
    <a-menu-item key="Customer">
      <ContactsOutlined /> <span>Khách Hàng</span>
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
      <template #title>Kho hàng</template>
      <a-menu-item key="Product">Tồn kho</a-menu-item>
      <a-menu-item key="PurchaseReceipt">Nhập hàng</a-menu-item>
      <a-menu-item key="Distributor">Nhà cung cấp</a-menu-item>
    </a-sub-menu>
    <a-menu-item key="Procedure">
      <PicCenterOutlined /> <span>Dịch vụ</span>
    </a-menu-item>
    <!-- <a-sub-menu key="Report">
      <template #icon>
        <AreaChartOutlined />
      </template>
      <template #title>Báo cáo</template>
      <a-menu-item key="FinanceReport">Báo cáo thu chi</a-menu-item>
    </a-sub-menu> -->
    <a-sub-menu key="Systems">
      <template #icon>
        <SettingOutlined />
      </template>
      <template #title>Hệ thống</template>
      <a-menu-item key="OrganizationInfo">Thông tin cơ sở</a-menu-item>
      <a-menu-item key="EmployeeInfo">Thông tin cá nhân</a-menu-item>
    </a-sub-menu>
  </a-menu>
</template>
