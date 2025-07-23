<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconEye, IconPrint, IconRight } from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import { InputDate, InputOptions, InputSelect, VueSelect } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { CustomerService, type Customer } from '@/modules/customer'
import { Laboratory, LaboratoryService } from '@/modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '@/modules/laboratory-group'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlService } from '@/modules/print-html'
import { Room, RoomInteractType, roomLaboratory, RoomService } from '@/modules/room'
import { TicketLaboratoryStatus } from '@/modules/ticket-laboratory'
import { TicketLaboratoryGroup, TicketLaboratoryGroupApi } from '@/modules/ticket-laboratory-group'
import { ESString, ESTimer } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import { onBeforeMount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalTicketLaboratoryResult from './ModalTicketLaboratoryGroupResult.vue'
import TicketLaboratoryStatusTag from './TicketLaboratoryStatusTag.vue'
import { fromTime, toTime } from './ticket-laboratory-group-list.ref'
import { PrintHtmlAction } from '@/modules/print-html/print-html.action'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import { PaymentMoneyStatus } from '@/modules/enum'

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organization } = MeService
const modalTicketLaboratoryResult = ref<InstanceType<typeof ModalTicketLaboratoryResult>>()

const roomMap = RoomService.roomMap
const currentRoom = ref<Room>(Room.blank())

const customerList = ref<Customer[]>([])
const dataLoading = ref(false)

const customerId = ref<number>()
const status = ref<TicketLaboratoryStatus | null>(null)
const paymentMoneyStatus = ref<PaymentMoneyStatus | null>(PaymentMoneyStatus.Paid)

const sortColumn = ref<'registeredAt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(Number(localStorage.getItem('TICKET_LABORATORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const laboratoryMap = LaboratoryService.laboratoryMap
const laboratoryGroupMap = LaboratoryGroupService.laboratoryGroupMap
const ticketLaboratoryGroupList = ref<TicketLaboratoryGroup[]>([])

const startFetchData = async (options?: { noLoading?: boolean }) => {
  try {
    if (options?.noLoading) {
      dataLoading.value = false
    } else {
      dataLoading.value = true
    }

    const { data, meta } = await TicketLaboratoryGroupApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        customer: true,
        ticket: true,
        ticketLaboratoryList: true,
      },
      filter: {
        customerId: customerId.value ? customerId.value : undefined,
        roomId: currentRoom.value.isCommon ? undefined : currentRoom.value.id || 0,
        status: status.value ? status.value : undefined,
        paymentMoneyStatus: paymentMoneyStatus.value ? paymentMoneyStatus.value : undefined,
        registeredAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            registeredAt: sortColumn.value === 'registeredAt' ? sortValue.value : undefined,
          }
        : { registeredAt: 'DESC' },
    })

    ticketLaboratoryGroupList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicList.vue:84 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

watch(
  () => route.params.roomId,
  async (newValue) => {
    const roomId = Number(newValue) || 0
    await RoomService.getMap()
    currentRoom.value = roomMap.value[roomId]
    if (!currentRoom.value) {
      currentRoom.value = Room.blank()
      currentRoom.value.isCommon = 1
      currentRoom.value.roomInteractType = RoomInteractType.Laboratory
    }
    startFetchData()
  },
  { immediate: true },
)

onBeforeMount(async () => {
  try {
    await Promise.all([
      CustomerService.refreshDB(),
      LaboratoryService.getMap(),
      LaboratoryGroupService.getMap(),
    ])
  } catch (error) {
    console.log('🚀 ~ onBeforeMount ~ error:', error)
  }
})

let currentRefreshTime = new Date().toISOString()
watch(
  () => roomLaboratory.value,
  async (newValue) => {
    const roomId = currentRoom.value.id
    if (newValue[roomId] !== currentRefreshTime || currentRoom.value.isCommon) {
      currentRefreshTime = newValue[roomId]
      await startFetchData({ noLoading: true })
    }
  },
  { deep: true },
)

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}

const searchingCustomer = async (text: string) => {
  if (!text) {
    customerList.value = []
    if (customerId.value) {
      // nếu đang chọn customer rồi, thì khi xóa hết text đi thì quay về search với text = ''
      customerId.value = undefined
      await startFetchData()
    }
  } else {
    customerList.value = await CustomerService.search(text)
  }
}

const selectCustomer = async (data?: Customer) => {
  customerId.value = data?.id
  await startFetchData()
}

const startFilter = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'registeredAt') => {
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
  localStorage.setItem('TICKET_LABORATORY_PAGINATION_LIMIT', String(limitSelect))
  await startFetchData()
}

const startPrint = async (tlgProp: TicketLaboratoryGroup) => {
  try {
    const ticketLaboratoryGroupData = await TicketLaboratoryGroupApi.detail(tlgProp.id, {
      relation: {
        // customer: true,
        // ticket: true,
        ticketUserList: true,
        // ticketLaboratoryList: true,
        ticketLaboratoryResultMap: true,
      },
    })
    ticketLaboratoryGroupData.customer = tlgProp.customer
    ticketLaboratoryGroupData.ticket = tlgProp.ticket
    ticketLaboratoryGroupData.ticketLaboratoryList = tlgProp.ticketLaboratoryList
    ticketLaboratoryGroupData.laboratoryGroup =
      laboratoryGroupMap.value[ticketLaboratoryGroupData.laboratoryGroupId] ||
      LaboratoryGroup.blank()
    ticketLaboratoryGroupData.ticketLaboratoryList?.forEach((i) => {
      i.laboratory = laboratoryMap.value[i.laboratoryId] || Laboratory.blank()
    })

    await PrintHtmlAction.startPrintResultTicketLaboratory({
      ticketLaboratoryGroup: ticketLaboratoryGroupData,
      customer: ticketLaboratoryGroupData.customer!,
      ticket: ticketLaboratoryGroupData.ticket!,
    })
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicLaboratory.vue:137 ~ startPrint ~ error:', error)
  }
}
</script>

<template>
  <ModalTicketLaboratoryResult ref="modalTicketLaboratoryResult" />
  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 text-lg font-medium">
        <Breadcrumb />
        <IconRight style="font-size: 0.7em; opacity: 0.5" />
        {{ currentRoom?.name || '' }}
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap"></div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 250px">
        <div>Khách hàng</div>
        <div>
          <InputOptions
            ref="inputSearchCustomer"
            :options="customerList.map((i) => ({ value: i.id, text: i.fullName, data: i }))"
            :maxHeight="260"
            placeholder="Tên hoặc Số Điện Thoại"
            @selectItem="({ data }) => selectCustomer(data)"
            @onFocusinFirst="handleFocusFirstSearchCustomer"
            @update:text="searchingCustomer"
          >
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ data.phone }} -
                {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
              </div>
              <div>
                {{ data.addressStreet }} - {{ data.addressWard }} - {{ data.addressProvince }}
              </div>
            </template>
          </InputOptions>
        </div>
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
        <div>Thanh toán</div>
        <div>
          <VueSelect
            v-model:value="paymentMoneyStatus"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: PaymentMoneyStatus.NoEffect, text: 'Không áp dụng' },
              { value: PaymentMoneyStatus.Pending, text: 'Chờ thanh toán' },
              { value: PaymentMoneyStatus.Paid, text: 'Đã thanh toán' },
            ]"
            @update:value="startFilter"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Kết quả</div>
        <div>
          <VueSelect
            v-model:value="status"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: TicketLaboratoryStatus.Pending, text: 'Đang chờ' },
              { value: TicketLaboratoryStatus.Completed, text: 'Hoàn thành' },
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
            <th style="width: 40px">Mã</th>
            <th style="width: 32px"></th>
            <th style="min-width: 150px">Khách hàng</th>
            <th>Tên phiếu</th>
            <th class="">Kết quả</th>
            <th class="cursor-pointer" @click="changeSort('registeredAt')">
              <div class="flex items-center gap-1 justify-center">
                <span>TG Chỉ định</span>
                <IconSort v-if="sortColumn !== 'registeredAt'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'registeredAt' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'registeredAt' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
            <th></th>
            <th></th>
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
          <tr v-if="ticketLaboratoryGroupList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(tlg, index) in ticketLaboratoryGroupList" :key="index">
            <td>
              <div class="flex justify-center items-center gap-2">
                {{
                  (tlg.ticket?.date?.toString()?.padStart(2, '0') || '') +
                  tlg.ticket?.month?.toString().padStart(2, '0') +
                  tlg.ticket?.year?.toString().slice(-2) +
                  '_' +
                  tlg.ticket?.dailyIndex?.toString().padStart(2, '0') +
                  '_' +
                  tlg.id
                }}
              </div>
            </td>
            <td><PaymentMoneyStatusTooltip :paymentMoneyStatus="tlg.paymentMoneyStatus" /></td>
            <td>
              <div>
                {{ tlg.customer?.fullName }}
              </div>
              <div v-if="tlg.customer?.note" class="text-xs italic">
                {{ tlg.customer?.note }}
              </div>
              <div class="text-xs italic">
                {{ ESString.formatAddress(tlg.customer!) }}
              </div>
            </td>
            <td class="">
              <div v-if="laboratoryGroupMap[tlg.laboratoryGroupId]?.name">
                {{ laboratoryGroupMap[tlg.laboratoryGroupId]?.name }}
              </div>
              <div v-else class="italic">Chưa phân nhóm phiếu</div>
              <div class="text-xs italic max-line-2">
                {{
                  tlg.ticketLaboratoryList
                    ?.map((tl) => laboratoryMap[tl.laboratoryId]?.name)
                    .join(', ')
                }}
              </div>
            </td>
            <td class="text-center">
              <TicketLaboratoryStatusTag :status="tlg.status" />
            </td>
            <td class="text-center">
              {{ ESTimer.timeToText(tlg.registeredAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td class="text-center">
              <a
                v-if="userPermission[PermissionId.LABORATORY_UPDATE_RESULT]"
                class="text-orange-500"
                @click="modalTicketLaboratoryResult?.openModal(tlg.id)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
              <a v-else @click="modalTicketLaboratoryResult?.openModal(tlg.id, { noEdit: true })">
                <IconEye width="22" height="22" />
              </a>
            </td>
            <td class="text-center">
              <a v-if="tlg.startedAt != null" @click="startPrint(tlg)">
                <IconPrint width="18" height="18" />
              </a>
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
