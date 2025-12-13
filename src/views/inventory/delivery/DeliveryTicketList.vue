<script setup lang="ts">
import { IconSetting } from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { InputDate, InputSelect, VueSelect } from '@/common/vue-form'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { CustomerService, type Customer } from '@/modules/customer'
import { DeliveryStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { RoleService } from '@/modules/role'
import { roomDeliveryPagination, RoomService } from '@/modules/room'
import { TicketQueryApi, TicketStatus } from '@/modules/ticket'
import { UserService } from '@/modules/user'
import { UserRoleService } from '@/modules/user-role'
import InputSearchCustomer from '@/views/component/InputSearchCustomer.vue'
import ModalTicketSendProduct from '@/views/room/room-ticket-base/ModalTicketSendProduct.vue'
import TicketDeliveryStatusTag from '@/views/room/room-ticket-base/TicketDeliveryStatusTag.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ESString, ESTimer, formatPhone } from '../../../utils'
import Breadcrumb from '../../component/Breadcrumb.vue'
import { fromTime, toTime } from './delivery-ticket-list.ref'

const modalTicketSendProduct = ref<InstanceType<typeof ModalTicketSendProduct>>()

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organization } = MeService

const dataLoading = ref(false)

const customerId = ref<number>(0)
const deliveryStatus = ref<DeliveryStatus>(DeliveryStatus.Pending)

const roomMap = RoomService.roomMap

const sortColumn = ref<'createdAt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(Number(localStorage.getItem('TICKET_CLINIC_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async (options?: { dataLoading: boolean }) => {
  try {
    if (options?.dataLoading) {
      dataLoading.value = true
    }

    const paginationResult = await TicketQueryApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        customer: true,
        // ticketAttributeList: true,
        ticketUserList: settingStore.TICKET_CLINIC_LIST.roleIdList.length ? true : undefined,
      },
      filter: {
        customerId: customerId.value ? customerId.value : undefined,
        createdAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
        deliveryStatus: deliveryStatus.value ?? undefined,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            createdAt: sortColumn.value === 'createdAt' ? sortValue.value : undefined,
          }
        : { createdAt: 'DESC' },
    })

    roomDeliveryPagination.value = paginationResult.ticketList
    total.value = paginationResult.total
  } catch (error) {
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  try {
    await Promise.all([
      startFetchData({ dataLoading: true }),
      RoleService.getMap(),
      UserService.getMap(),
      UserRoleService.getMapList(),
      CustomerService.refreshDB(),
    ])
  } catch (error) {}
})

const selectCustomer = async (data?: Customer) => {
  if (data) {
    customerId.value = data?.id
    await startFetchData()
  }
}

const startFilter = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'createdAt') => {
  if (sortValue.value == 'DESC') {
    sortColumn.value = ''
    sortValue.value = ''
  } else if (sortValue.value == 'ASC') {
    sortColumn.value = column
    sortValue.value = 'DESC'
  } else {
    sortColumn.value = column
    sortValue.value = 'ASC'
  }
  await startFilter()
}

const changePage = async (pageSelect: number) => {
  await startFetchData()
}
const changeLimit = async (limitSelect: any) => {
  limit.value = limitSelect
  localStorage.setItem('TICKET_CLINIC_PAGINATION_LIMIT', String(limitSelect))
  await startFetchData()
}
</script>

<template>
  <ModalTicketSendProduct ref="modalTicketSendProduct" />

  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:block">
        <Breadcrumb />
      </div>
      <div></div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
      <div></div>
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu"></div>
      </VueDropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex-basis: 250px; flex-grow: 1">
        <InputSearchCustomer
          v-model:customerId="customerId"
          @selectCustomer="selectCustomer"
          :clearTextIfNoSelect="false"
          :editCustomer="false"
        />
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Từ ngày</div>
        <div>
          <InputDate
            v-model:value="fromTime"
            type-parser="number"
            class="w-full"
            @selectTime="startFilter"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Đến ngày</div>
        <div>
          <InputDate
            v-model:value="toTime"
            type-parser="number"
            class="w-full"
            @selectTime="startFilter"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Gửi hàng</div>
        <div>
          <VueSelect
            v-model:value="deliveryStatus"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: DeliveryStatus.Pending, text: 'Chờ gửi hàng' },
              { value: DeliveryStatus.Delivered, text: 'Đã gửi hàng' },
            ]"
            @update:value="startFilter"
          />
        </div>
      </div>

      <div>
        <div>&nbsp;</div>
        <div>
          <VueButton color="blue" @click="startFilter">Tìm kiếm</VueButton>
        </div>
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th class="cursor-pointer" @click="changeSort('id')">
              <div class="flex items-center gap-1 justify-center">
                <span>Hồ Sơ</span>
                <IconSort v-if="sortColumn !== 'id'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'id' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'id' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('createdAt')">
              <div class="flex items-center gap-1 justify-center">
                <span>Trạng thái</span>
                <IconSort v-if="sortColumn !== 'createdAt'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'createdAt' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'createdAt' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
            <th style="min-width: 150px">Khách hàng</th>
            <th class="">Thuốc - Vật tư</th>
            <th>Thanh toán</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody v-if="dataLoading">
          <tr>
            <td colspan="100">
              <div class="vue-skeleton-loading"></div>
              <div class="vue-skeleton-loading mt-2"></div>
            </td>
          </tr>
          <tr>
            <td colspan="100">
              <div class="vue-skeleton-loading"></div>
              <div class="vue-skeleton-loading mt-2"></div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-if="roomDeliveryPagination.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticket, index) in roomDeliveryPagination" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
              {{ ticket.id }}
            </td>
            <td class="">
              <div class="flex gap-1 justify-between items-center">
                <router-link
                  :to="{
                    name: 'TicketClinicDetailContainer',
                    params: { roomId: ticket.roomId, ticketId: ticket.id },
                  }"
                >
                  <div class="flex justify-center items-center gap-2">
                    <span>
                      {{
                        ticket.year?.toString().slice(-2) +
                        ticket.month?.toString().padStart(2, '0') +
                        ticket.date?.toString().padStart(2, '0') +
                        '_' +
                        ticket.dailyIndex?.toString().padStart(2, '0')
                      }}
                    </span>
                  </div>
                </router-link>
              </div>
              <div>{{ roomMap[ticket.roomId]?.name || '' }}</div>
            </td>
            <td>
              <div><TicketStatusTag :ticket="ticket" /></div>
              <div>{{ ESTimer.timeToText(ticket.createdAt, 'hh:mm DD/MM/YYYY') }}</div>
            </td>
            <td>
              <div>
                {{ ticket.customer?.fullName }}
              </div>
              <div v-if="ticket.customer?.note" class="text-xs italic">
                {{ ticket.customer?.note }}
              </div>
              <div class="text-xs italic">
                {{ ESString.formatAddress(ticket.customer!) }}
              </div>
              <div>
                {{
                  ESTimer.timeToText(ticket.customer?.birthday, 'DD/MM/YYYY') ||
                  ticket.customer?.yearOfBirth ||
                  ''
                }}
              </div>
              <div>
                {{ formatPhone(ticket.customer?.phone) }}
              </div>
            </td>

            <td>
              <div class="flex flex-wrap justify-between items-center">
                <TicketDeliveryStatusTag :deliveryStatus="ticket.deliveryStatus" />
                <VueButton
                  v-if="
                    ticket.deliveryStatus === DeliveryStatus.Pending &&
                    userPermission[PermissionId.TICKET_CHANGE_PRODUCT_SEND_PRODUCT]
                  "
                  size="small"
                  icon="send"
                  color="green"
                  @click="
                    modalTicketSendProduct?.openModal({
                      ticket,
                      queryTicketProduct: true,
                    })
                  "
                >
                  <span>Xuất thuốc - Vật tư</span>
                </VueButton>
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(ticket.paidAmount) }}
            </td>
            <td class="text-right">
              <div>{{ formatMoney(ticket.totalMoney) }}</div>
              <div v-if="ticket.debtAmount" class="text-xs">
                Nợ: {{ formatMoney(ticket.debtAmount) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="my-4 flex flex-wrap justify-end items-center gap-4">
        <div class="">Tổng: {{ total }}</div>
        <VuePagination
          class="ml-auto"
          v-model:page="page"
          :total="total"
          :limit="limit"
          @update:page="changePage"
        />
        <InputSelect
          v-model:value="limit"
          @update:value="changeLimit"
          :options="[
            { value: 10, label: '10 / page' },
            { value: 20, label: '20 / page' },
            { value: 50, label: '50 / page' },
            { value: 100, label: '100 / page' },
          ]"
        />
      </div>
    </div>
  </div>
</template>
