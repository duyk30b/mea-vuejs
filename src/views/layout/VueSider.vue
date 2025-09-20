<script setup lang="ts">
import { IconDoorOpen } from '@/common/icon-google'
import { RoomType, RoomService, RoomTicketStyle } from '@/modules/room'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconApartment,
  IconAppstore,
  IconAreaChart,
  IconCalendar,
  IconContacts,
  IconControl,
  IconDollar,
  IconHome,
  IconPicCenter,
  IconShop,
  IconTeam,
} from '../../common/icon-antd'
import { MeService } from '../../modules/_me/me.service'
import { PermissionId } from '../../modules/permission/permission.enum'

const props = defineProps<{ collapsed?: boolean }>()
const { userPermission, organizationPermission, user, roomIdMap } = MeService

const emit = defineEmits(['handleShowDrawer'])
const router = useRouter()

const openKeys = ref<string[]>([])
const selectedKeys = ref<string[]>([])

const roomList = RoomService.roomList

onMounted(async () => {
  await RoomService.getAll()
})

watchEffect(() => {
  const currentRoute = router.currentRoute.value
  // slice 1 vì vị trí 0 là Home
  const openRouterName = currentRoute.matched.slice(1).map((routeItem) => {
    if (routeItem.meta.menuKey && typeof routeItem.meta.menuKey === 'function') {
      return routeItem.meta.menuKey(routeItem, currentRoute.params)
    }
    return routeItem.name
  })
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
      <template #icon><IconHome /></template>
      <span><router-link :to="{ name: 'AppHome' }">Home</router-link></span>
    </a-menu-item>

    <a-menu-item key="AppointmentList">
      <template #icon><IconCalendar /></template>
      <span><router-link :to="{ name: 'AppointmentList' }">Lịch hẹn</router-link></span>
    </a-menu-item>

    <template v-for="room in roomList" :key="room.id">
      <a-menu-item
        v-if="
          roomIdMap[room.id] &&
          room.roomType === RoomType.Ticket &&
          [RoomTicketStyle.TicketOrder].includes(room.roomStyle)
        "
        :key="'RoomTicketOrder' + '_' + room.id"
      >
        <template #icon><IconShop /></template>
        <span>
          <router-link :to="{ name: 'RoomTicketOrder', params: { roomId: room.id } }">
            {{ room.name }}
          </router-link>
        </span>
      </a-menu-item>

      <a-menu-item
        v-if="
          roomIdMap[room.id] &&
          room.roomType === RoomType.Ticket &&
          [RoomTicketStyle.TicketReception].includes(room.roomStyle)
        "
        :key="'RoomTicketReception' + '_' + room.id"
      >
        <template #icon><IconDoorOpen /></template>
        <span>
          <router-link :to="{ name: 'RoomTicketReception', params: { roomId: room.id } }">
            {{ room.name }}
          </router-link>
        </span>
      </a-menu-item>

      <a-menu-item
        v-if="
          roomIdMap[room.id] &&
          room.roomType === RoomType.Ticket &&
          [
            RoomTicketStyle.TicketClinicGeneral,
            RoomTicketStyle.TicketClinicObstetric,
            RoomTicketStyle.TicketClinicEye,
          ].includes(room.roomStyle)
        "
        :key="'RoomTicketClinic' + '_' + room.id"
      >
        <template #icon><IconApartment /></template>
        <span>
          <router-link :to="{ name: 'RoomTicketClinic', params: { roomId: room.id } }">
            {{ room.name }}
          </router-link>
        </span>
      </a-menu-item>

      <a-menu-item
        v-if="
          roomIdMap[room.id] &&
          room.roomType === RoomType.Ticket &&
          [RoomTicketStyle.TicketSpa].includes(room.roomStyle)
        "
        :key="'RoomTicketSpa' + '_' + room.id"
      >
        <template #icon><IconApartment /></template>
        <span>
          <router-link :to="{ name: 'RoomTicketSpa', params: { roomId: room.id } }">
            {{ room.name }}
          </router-link>
        </span>
      </a-menu-item>
    </template>

    <a-menu-item v-if="userPermission[PermissionId.CUSTOMER_MENU]" key="Customer">
      <template #icon>
        <IconContacts />
      </template>
      <span>
        <router-link :to="{ name: 'Customer' }">Khách hàng</router-link>
      </span>
    </a-menu-item>
    <a-sub-menu
      v-if="
        userPermission[PermissionId.PRODUCT_MENU] ||
        userPermission[PermissionId.PURCHASE_ORDER_MENU] ||
        userPermission[PermissionId.STOCK_CHECK_MENU] ||
        userPermission[PermissionId.DISTRIBUTOR_MENU]
      "
      key="Inventory"
    >
      <template #icon>
        <IconAppstore />
      </template>
      <template #title>Kho hàng</template>
      <a-menu-item v-if="userPermission[PermissionId.PRODUCT_MENU]" key="ProductList">
        <router-link :to="{ name: 'ProductList' }">Sản phẩm</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.PURCHASE_ORDER_MENU]" key="PurchaseOrder">
        <router-link :to="{ name: 'PurchaseOrder' }">Nhập hàng</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.PRODUCT_MENU]" key="DeliveryTicketList">
        <router-link :to="{ name: 'DeliveryTicketList' }">Chờ xuất hàng</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.DISTRIBUTOR_MENU]" key="Distributor">
        <router-link :to="{ name: 'Distributor' }">Nhà cung cấp</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.STOCK_CHECK_MENU]" key="StockCheck">
        <router-link :to="{ name: 'StockCheck' }">Kiểm hàng</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-menu-item key="MasterData">
      <template #icon>
        <IconPicCenter />
      </template>
      <span>
        <router-link :to="{ name: 'MasterData' }">Danh mục</router-link>
      </span>
    </a-menu-item>
    <a-sub-menu v-if="userPermission[PermissionId.PAYMENT_MENU]" key="Finance">
      <template #icon>
        <IconDollar />
      </template>
      <template #title>Phòng tài chính</template>
      <a-menu-item key="FinanceTicketList">
        <router-link :to="{ name: 'FinanceTicketList' }">Chờ thanh toán</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.PAYMENT_MENU]" key="PaymentList">
        <router-link :to="{ name: 'PaymentList' }">Danh sách thu chi</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu
      v-if="
        userPermission[PermissionId.STATISTIC_TICKET] ||
        userPermission[PermissionId.STATISTIC_PURCHASE_ORDER] ||
        userPermission[PermissionId.STATISTIC_CUSTOMER] ||
        userPermission[PermissionId.STATISTIC_PRODUCT] ||
        userPermission[PermissionId.STATISTIC_PROCEDURE] ||
        userPermission[PermissionId.STATISTIC_LABORATORY] ||
        userPermission[PermissionId.STATISTIC_RADIOLOGY]
      "
      key="Statistic"
    >
      <template #icon>
        <IconAreaChart />
      </template>
      <template #title>Thống kê</template>
      <a-menu-item v-if="userPermission[PermissionId.STATISTIC_TICKET]" key="StatisticTicket">
        <router-link :to="{ name: 'StatisticTicket' }">Doanh Thu</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.STATISTIC_CUSTOMER]" key="StatisticCustomer">
        <router-link :to="{ name: 'StatisticCustomer' }">Báo cáo khách hàng</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.STATISTIC_PRODUCT]" key="StatisticProduct">
        <router-link :to="{ name: 'StatisticProduct' }">Báo cáo sản phẩm</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.STATISTIC_PROCEDURE]" key="StatisticProcedure">
        <router-link :to="{ name: 'StatisticProcedure' }">Báo cáo dịch vụ</router-link>
      </a-menu-item>
      <a-menu-item
        v-if="userPermission[PermissionId.STATISTIC_LABORATORY]"
        key="StatisticLaboratory"
      >
        <router-link :to="{ name: 'StatisticLaboratory' }">Báo cáo xét nghiệm</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.STATISTIC_RADIOLOGY]" key="StatisticRadiology">
        <router-link :to="{ name: 'StatisticRadiology' }">Báo cáo phiếu CĐHA</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu
      v-if="
        userPermission[PermissionId.USER_ACCOUNT_MENU] ||
        userPermission[PermissionId.USER_ROLE_MENU]
      "
      key="User"
    >
      <template #icon>
        <IconTeam />
      </template>
      <template #title>Nhân viên</template>
      <a-menu-item v-if="userPermission[PermissionId.USER_ROLE_MENU]" key="Role">
        <router-link :to="{ name: 'Role' }">Vai trò</router-link>
      </a-menu-item>
      <a-menu-item v-if="userPermission[PermissionId.USER_ACCOUNT_MENU]" key="Account">
        <router-link :to="{ name: 'Account' }">Tài khoản</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu key="Systems">
      <template #icon>
        <IconControl />
      </template>
      <template #title>Hệ thống</template>
      <a-menu-item
        v-if="userPermission[PermissionId.ORGANIZATION_UPDATE_INFO]"
        key="OrganizationInfo"
      >
        <router-link :to="{ name: 'OrganizationInfo' }">Thông tin cơ sở</router-link>
      </a-menu-item>
      <a-menu-item key="UserInfo">
        <router-link :to="{ name: 'UserInfo' }">Thông tin cá nhân</router-link>
      </a-menu-item>
      <a-menu-item
        v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
        key="SystemSetting"
      >
        <router-link :to="{ name: 'SystemSetting' }">Cài đặt</router-link>
      </a-menu-item>
    </a-sub-menu>
    <a-sub-menu v-if="user?.oid === 1" key="ROOT">
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
