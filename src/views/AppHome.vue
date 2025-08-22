<script setup lang="ts">
// 2 màu khác trông cũng đẹp:  9dc183 ff6761 daa520
import { PermissionId } from '@/modules/permission/permission.enum'
import { IconAreaChart, IconMedicalBox, IconShop, IconShoppingCart } from '../common/icon-antd'
import AppHomeStatistic from './AppHomeStatistic.vue'
import { MeService } from '@/modules/_me/me.service'

const { userPermission, organizationPermission, user, roomIdMap } = MeService
</script>

<template>
  <div class="mt-2">
    <div class="">
      <div class="flex flex-wrap justify-between">
        <div style="flex-grow: 1; flex-basis: 22%; min-width: 300px" class="p-4">
          <div
            class="bg-[#ff6f61] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Room' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">PHÒNG KHÁM</div>
              <div class="mt-4">Khám, chẩn đoán, sử dụng dịch vụ và kê đơn thuốc</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <IconMedicalBox />
            </div>
          </div>
        </div>

        <div
          v-if="userPermission[PermissionId.TICKET_DRAFT_CRUD]"
          style="flex-grow: 1; flex-basis: 22%; min-width: 300px"
          class="p-4"
        >
          <div
            class="bg-[#0094ff] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'TicketOrderList' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">BÁN HÀNG</div>
              <div class="mt-4">Tạo hóa đơn bán hàng, dịch vụ cho khách lẻ</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <IconShoppingCart />
            </div>
          </div>
        </div>

        <!-- <div style="flex-grow: 1; flex-basis: 22%; min-width: 300px;" class="p-4">
          <div
            class="bg-[#008080] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Customer' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Khách hàng</div>
              <div class="mt-4">Quản lý thông tin khách hàng, quản lý nợ, lịch sử mua hàng</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <TeamOutlined />
            </div>
          </div>
        </div> -->

        <div
          v-if="userPermission[PermissionId.PRODUCT_MENU]"
          style="flex-grow: 1; flex-basis: 22%; min-width: 300px"
          class="p-4"
        >
          <div
            class="bg-[#2fb388] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'ProductList' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Tồn kho</div>
              <div class="mt-4">Quản lý tồn kho, hạn sử dụng</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <IconShop />
            </div>
          </div>
        </div>

        <!-- <div style="flex-grow: 1; flex-basis: 22%; min-width: 300px;" class="p-4">
          <div
            class="bg-[#708090] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Procedure' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Nhà cung cấp</div>
              <div class="mt-4">Quản lý thông tin nhà cung cấp, quản lý nợ</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ShoppingCartOutlined />
            </div>
          </div>
        </div> -->

        <!-- <div style="flex-grow: 1; flex-basis: 22%; min-width: 300px;" class="p-4">
          <div
            class="bg-[#daa520] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'Procedure' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">DỊCH VỤ</div>
              <div class="mt-4">Quản lý thông tin các dịch vụ, thủ thuật</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <ShoppingCartOutlined />
            </div>
          </div>
        </div> -->

        <div
          v-if="userPermission[PermissionId.PAYMENT_MENU]"
          style="flex-grow: 1; flex-basis: 22%; min-width: 300px"
          class="p-4"
        >
          <div
            class="bg-[#9859e9] h-full p-4 gap-4 flex justify-between items-start rounded text-white cursor-pointer"
            @click="$router.push({ name: 'PaymentList' })"
          >
            <div>
              <div class="text-xl uppercase" style="font-weight: 500">Phòng thu ngân</div>
              <div class="mt-4">Quản lý tài chính, thu tiền khách hàng, chi tiền dịch vụ</div>
            </div>
            <div class="text-6xl mt-2" style="opacity: 0.3">
              <IconAreaChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="mx-4 mt-4">
    <AppHomeStatistic />
  </div>
</template>

<style scoped></style>
