<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconApartment,
  IconAppstore,
  IconAreaChart,
  IconContacts,
  IconControl,
  IconDollar,
  IconHome,
  IconMedicalBox,
  IconPicCenter,
  IconShop,
  IconTeam,
} from '../../common/icon-antd'
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
      <template #icon>
        <IconHome />
      </template>
      <span>
        <router-link :to="{ name: 'AppHome' }">Home</router-link>
      </span>
    </a-menu-item>
    <a-sub-menu v-if="permissionIdMap[PermissionId.TICKET_CLINIC_READ]" key="Clinic">
      <template #icon>
        <IconMedicalBox />
      </template>
      <template #title>Phòng khám</template>
      <a-menu-item key="TicketClinicList">
        <router-link :to="{ name: 'TicketClinicList' }">Danh sách khám</router-link>
      </a-menu-item>
      <a-menu-item key="AppointmentList">
        <router-link :to="{ name: 'AppointmentList' }">Hẹn khám</router-link>
      </a-menu-item>
    </a-sub-menu>
    <!-- <a-sub-menu
      v-if="permissionIdMap[PermissionId.TICKET_TRADITIONAL_READ]"
      key="TicketTraditional">
      <template #icon>
        <IconMedicalBox />
      </template>
      <template #title>PK Đông Y</template>
      <a-menu-item key="TicketTraditionalList">
        <router-link :to="{ name: 'TicketTraditionalList' }">Danh sách khám</router-link>
      </a-menu-item>
    </a-sub-menu> -->
    <!-- <a-sub-menu v-if="permissionIdMap[PermissionId.TICKET_TRADITIONAL_READ]" key="TicketSpa">
      <template #icon>
        <IconLabPanel />
      </template>
      <template #title>Phòng Thẩm mỹ</template>
      <a-menu-item key="TicketSpaList">
        <router-link :to="{ name: 'TicketSpaList' }">Đón tiếp</router-link>
      </a-menu-item>
    </a-sub-menu> -->
    <a-sub-menu v-if="permissionIdMap[PermissionId.TICKET_ORDER_READ]" key="TicketOrder">
      <template #icon>
        <IconShop />
      </template>
      <template #title>Bán hàng</template>
      <a-menu-item
        v-if="
          permissionIdMap[PermissionId.TICKET_ORDER_DRAFT_CRUD] ||
          permissionIdMap[PermissionId.TICKET_ORDER_DEBT_SUCCESS_CRUD]
        "
        key="TicketOrderUpsert"
      >
        <router-link :to="{ name: 'TicketOrderUpsert' }">Tạo hóa đơn</router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.TICKET_ORDER_READ]" key="TicketOrderList">
        <router-link :to="{ name: 'TicketOrderList' }">Danh sách hóa đơn</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-menu-item v-if="permissionIdMap[PermissionId.CUSTOMER_READ]" key="Customer">
      <template #icon>
        <IconContacts />
      </template>
      <span>
        <router-link :to="{ name: 'Customer' }">Khách hàng</router-link>
      </span>
    </a-menu-item>
    <a-sub-menu
      v-if="
        permissionIdMap[PermissionId.PRODUCT_READ] ||
        permissionIdMap[PermissionId.RECEIPT_READ] ||
        permissionIdMap[PermissionId.STOCK_CHECK_READ] ||
        permissionIdMap[PermissionId.DISTRIBUTOR_READ]
      "
      key="Inventory"
    >
      <template #icon>
        <IconAppstore />
      </template>
      <template #title>Sản phẩm</template>
      <a-menu-item v-if="permissionIdMap[PermissionId.PRODUCT_READ]" key="Product">
        <router-link :to="{ name: 'Product' }">Tồn kho</router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.RECEIPT_READ]" key="Receipt">
        <router-link :to="{ name: 'Receipt' }">Nhập hàng</router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.DISTRIBUTOR_READ]" key="Distributor">
        <router-link :to="{ name: 'Distributor' }">Nhà cung cấp</router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.STOCK_CHECK_READ]" key="StockCheck">
        <router-link :to="{ name: 'StockCheck' }">Kiểm hàng</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-menu-item v-if="permissionIdMap[PermissionId.MASTER_DATA]" key="MasterData">
      <template #icon>
        <IconPicCenter />
      </template>
      <span>
        <router-link :to="{ name: 'MasterData' }">Danh mục</router-link>
      </span>
    </a-menu-item>
    <a-sub-menu v-if="permissionIdMap[PermissionId.PAYMENT_READ]" key="Finance">
      <template #icon>
        <IconDollar />
      </template>
      <template #title>Tài chính</template>
      <a-menu-item v-if="permissionIdMap[PermissionId.PAYMENT_READ]" key="PaymentList">
        <router-link :to="{ name: 'PaymentList' }">Danh sách thu chi</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu
      v-if="
        permissionIdMap[PermissionId.STATISTIC_TICKET] ||
        permissionIdMap[PermissionId.STATISTIC_RECEIPT] ||
        permissionIdMap[PermissionId.STATISTIC_CUSTOMER] ||
        permissionIdMap[PermissionId.STATISTIC_PRODUCT] ||
        permissionIdMap[PermissionId.STATISTIC_PROCEDURE] ||
        permissionIdMap[PermissionId.STATISTIC_LABORATORY] ||
        permissionIdMap[PermissionId.STATISTIC_RADIOLOGY]
      "
      key="Statistic"
    >
      <template #icon>
        <IconAreaChart />
      </template>
      <template #title>Thống kê</template>
      <a-menu-item v-if="permissionIdMap[PermissionId.STATISTIC_TICKET]" key="StatisticTicket">
        <router-link :to="{ name: 'StatisticTicket' }">Báo cáo phiếu thu</router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.STATISTIC_CUSTOMER]" key="StatisticCustomer">
        <router-link :to="{ name: 'StatisticCustomer' }">Báo cáo khách hàng</router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.STATISTIC_PRODUCT]" key="StatisticProduct">
        <router-link :to="{ name: 'StatisticProduct' }">Báo cáo kho</router-link>
      </a-menu-item>
      <a-menu-item
        v-if="permissionIdMap[PermissionId.STATISTIC_PROCEDURE]"
        key="StatisticProcedure"
      >
        <router-link :to="{ name: 'StatisticProcedure' }">Báo cáo dịch vụ</router-link>
      </a-menu-item>
      <a-menu-item
        v-if="permissionIdMap[PermissionId.STATISTIC_LABORATORY]"
        key="StatisticLaboratory"
      >
        <router-link :to="{ name: 'StatisticLaboratory' }">Báo cáo xét nghiệm</router-link>
      </a-menu-item>
      <a-menu-item
        v-if="permissionIdMap[PermissionId.STATISTIC_RADIOLOGY]"
        key="StatisticRadiology"
      >
        <router-link :to="{ name: 'StatisticRadiology' }">Báo cáo phiếu CĐHA</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu
      v-if="
        permissionIdMap[PermissionId.ROLE_CRUD] ||
        permissionIdMap[PermissionId.ACCOUNT_CRUD] ||
        permissionIdMap[PermissionId.COMMISSION_CRUD]
      "
      key="User"
    >
      <template #icon>
        <IconTeam />
      </template>
      <template #title>Nhân viên</template>
      <a-menu-item v-if="permissionIdMap[PermissionId.ROLE_CRUD]" key="Role">
        <router-link :to="{ name: 'Role' }">Vai trò</router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.ACCOUNT_CRUD]" key="Account">
        <router-link :to="{ name: 'Account' }">Tài khoản</router-link>
      </a-menu-item>
      <a-menu-item v-if="permissionIdMap[PermissionId.COMMISSION_CRUD]" key="Commission">
        <router-link :to="{ name: 'Commission' }">Vị trí</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu key="Systems">
      <template #icon>
        <IconControl />
      </template>
      <template #title>Hệ thống</template>
      <a-menu-item
        v-if="permissionIdMap[PermissionId.ORGANIZATION_UPDATE_INFO]"
        key="OrganizationInfo"
      >
        <router-link :to="{ name: 'OrganizationInfo' }">Thông tin cơ sở</router-link>
      </a-menu-item>
      <a-menu-item key="UserInfo">
        <router-link :to="{ name: 'UserInfo' }">Thông tin cá nhân</router-link>
      </a-menu-item>
      <a-menu-item
        v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
        key="SystemSetting"
      >
        <router-link :to="{ name: 'SystemSetting' }">Cài đặt</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu v-if="meStore.user?.oid === 1" key="ROOT">
      <template #icon>
        <IconApartment />
      </template>
      <template #title>ROOT</template>
      <a-menu-item key="RootOrganizationList">
        <router-link :to="{ name: 'RootOrganizationList' }">Organization</router-link>
      </a-menu-item>
      <a-menu-item key="RootUserList">
        <router-link :to="{ name: 'RootUserList' }">User</router-link>
      </a-menu-item>
      <a-menu-item key="RootData">
        <router-link :to="{ name: 'RootData' }">Data</router-link>
      </a-menu-item>
    </a-sub-menu>
  </a-menu>
</template>
