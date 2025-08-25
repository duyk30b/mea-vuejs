<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconFileSearch, IconRight, IconSetting } from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { InputDate, InputOptions, InputSelect, VueSelect } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { CustomerService, type Customer } from '@/modules/customer'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PositionInteractType } from '@/modules/position'
import { ProcedureType } from '@/modules/procedure'
import { RoleService } from '@/modules/role'
import { Room, RoomType, RoomService } from '@/modules/room'
import { roomTicketPagination } from '@/modules/room/room.ref'
import { TicketQueryApi, TicketStatus } from '@/modules/ticket'
import type { TicketProcedure } from '@/modules/ticket-procedure'
import type { TicketUser } from '@/modules/ticket-user'
import { UserService } from '@/modules/user'
import { ESTimer } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import { onBeforeMount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TicketLink from '../../room-ticket-base/TicketLink.vue'
import ModalProcessTicketProcedureRegimen from '../../room-ticket-base/procedure/ModalProcessTicketProcedureRegimen.vue'
import ModalShowTicketProcedureRegimen from '../../room-ticket-base/procedure/ModalShowTicketProcedureRegimen.vue'
import { fromTime, toTime } from '../../room-ticket-base/room-ticket.ref'
import ModalTicketSpaCreate from '../create/ModalTicketSpaCreate.vue'
import ModalTicketSpaListSetting from './ModalTicketSpaListSetting.vue'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketSpaCreate = ref<InstanceType<typeof ModalTicketSpaCreate>>()
const modalTicketSpaListSetting = ref<InstanceType<typeof ModalTicketSpaListSetting>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalProcessTicketProcedureRegimen =
  ref<InstanceType<typeof ModalProcessTicketProcedureRegimen>>()
const modalShowTicketProcedureRegimen = ref<InstanceType<typeof ModalShowTicketProcedureRegimen>>()

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const customerList = ref<Customer[]>([])
const dataLoading = ref(false)

const roomMap = RoomService.roomMap
const currentRoom = ref<Room>(Room.blank())
const customerId = ref<number>()
const status = ref<TicketStatus | null>(null)

const roleMap = RoleService.roleMap
const userMap = UserService.userMap

const sortColumn = ref<'registeredAt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(Number(localStorage.getItem('TICKET_CLINIC_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const paginationResult = await TicketQueryApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        customer: true,
        // ticketAttributeList: true,
        ticketUserList: settingStore.TICKET_SPA_LIST.roleIdList.length ? {} : false,
        ticketProcedureList: { relation: { ticketProcedureItemList: { imageList: true } } },
      },
      filter: {
        roomId: currentRoom.value.isCommon ? undefined : currentRoom.value.id || 0,
        customerId: customerId.value ? customerId.value : undefined,
        registeredAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
        status: status.value ?? undefined,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            registeredAt: sortColumn.value === 'registeredAt' ? sortValue.value : undefined,
          }
        : { registeredAt: 'DESC' },
    })

    for (let i = 0; i < paginationResult.ticketList.length; i++) {
      const element = paginationResult.ticketList[i]
      await element.refreshProcedure()
    }

    roomTicketPagination.value[currentRoom.value.id] = paginationResult.ticketList
    total.value = paginationResult.total
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
      currentRoom.value.roomType = RoomType.Ticket
    }
    startFetchData()
  },
  { immediate: true },
)

onBeforeMount(async () => {
  try {
    await Promise.all([RoleService.getMap(), UserService.getMap(), CustomerService.refreshDB()])
  } catch (error) {
    console.log('🚀 ~ RoomTicketList.vue:126 ~ onBeforeMount ~ error:', error)
  }
})

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
  localStorage.setItem('TICKET_CLINIC_PAGINATION_LIMIT', String(limitSelect))
  await startFetchData()
}

const handleModalTicketSpaCreateSuccess = async (ticketId: number) => {
  await startFetchData()
}

const handleModalTicketSpaListSettingSuccess = async () => {
  // await startFetchData()
}

const handleProcessTicketProcedureRegimenSuccess = (data: TicketProcedure) => {
  const findTicket = roomTicketPagination.value[currentRoom.value.id]?.find((i) => {
    return i.id === data.ticketId
  })
  if (!findTicket) return

  const findExist = (findTicket.ticketProcedureList || []).findIndex((i) => {
    return i.id === data.id
  })
  if (findExist !== -1) {
    Object.assign(findTicket.ticketProcedureList![findExist], data)
  }
}
</script>

<template>
  <ModalTicketSpaCreate ref="modalTicketSpaCreate" @success="handleModalTicketSpaCreateSuccess" />
  <ModalShowTicketProcedureRegimen ref="modalShowTicketProcedureRegimen" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalProcessTicketProcedureRegimen
    ref="modalProcessTicketProcedureRegimen"
    @success="handleProcessTicketProcedureRegimenSuccess"
  />
  <ModalTicketSpaListSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketSpaListSetting"
    @success="handleModalTicketSpaListSettingSuccess"
  />

  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 text-lg font-medium">
        <Breadcrumb />
        <IconRight style="font-size: 0.7em; opacity: 0.5" />
        {{ currentRoom?.name || '' }}
      </div>
      <div>
        <VueButton
          color="blue"
          icon="plus"
          @click="
            modalTicketSpaCreate?.openModal({
              roomId: currentRoom.id,
              ticketStatusRegister: TicketStatus.Executing,
            })
          "
        >
          Tiếp đón mới
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a @click="modalTicketSpaListSetting?.openModal()">Cài đặt hiển thị</a>
        </div>
      </VueDropdown>
    </div>
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
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="status"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: TicketStatus.Schedule, text: 'Đặt hẹn' },
              { value: TicketStatus.Draft, text: 'Đang đợi' },
              { value: TicketStatus.Deposited, text: 'Tạm ứng' },
              { value: TicketStatus.Executing, text: 'Đang xử lý' },
              { value: TicketStatus.Debt, text: 'Nợ' },
              { value: TicketStatus.Completed, text: 'Hoàn thành' },
            ]"
            @update:value="startFilter"
          />
        </div>
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'" class="">Id-RoomId</th>
            <th class="cursor-pointer" @click="changeSort('id')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã Hồ Sơ</span>
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
            <th class="cursor-pointer" @click="changeSort('registeredAt')">
              <div class="flex items-center gap-1 justify-center">
                <span>T.Thái</span>
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
            <th style="min-width: 150px">Khách hàng</th>
            <!-- <th style="white-space: nowrap">T.Tin</th> -->
            <!-- <th style="">Lý do</th> -->
            <th style="">Dịch vụ</th>
            <th v-for="(roleId, i) in settingStore.TICKET_SPA_LIST.roleIdList" :key="i">
              {{ roleMap[roleId]?.name || '' }}
            </th>
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
          <tr v-if="roomTicketPagination[currentRoom.id]?.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="ticket in roomTicketPagination[currentRoom.id]" :key="ticket.id">
            <td v-if="CONFIG.MODE === 'development'" class="text-center" style="color: violet">
              {{ ticket.id }} - {{ ticket.roomId }}
            </td>
            <td class="text-center">
              <div class="flex gap-1 justify-between items-center">
                <TicketLink :ticket="ticket" />
                <a
                  v-if="
                    [
                      TicketStatus.Schedule,
                      TicketStatus.Draft,
                      TicketStatus.Deposited,
                      TicketStatus.Executing,
                    ].includes(ticket.status)
                  "
                  style="color: #eca52b"
                  class="text-xl"
                  @click="
                    modalTicketSpaCreate?.openModal({ roomId: ticket.roomId, ticketId: ticket.id })
                  "
                >
                  <IconEditSquare />
                </a>
              </div>
            </td>
            <td>
              <div>
                <TicketStatusTag :ticket="ticket" />
              </div>
              <div class="text-xs italic">
                {{ ESTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <div>
                {{ ticket.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(ticket.customerId)">
                  <IconFileSearch />
                </a>
              </div>
              <div class="text-xs italic">
                {{
                  ESTimer.timeToText(ticket.customer?.birthday, 'DD/MM/YYYY') ||
                  ticket.customer?.yearOfBirth ||
                  ''
                }}
                - {{ ticket.customer?.getAge ? ticket.customer?.getAge + ' Tuổi' : '' }}
              </div>
              <div v-if="ticket.customer?.note" class="text-xs italic">
                {{ ticket.customer?.note }}
              </div>
            </td>
            <!-- <td>
              <div>
                {{ formatPhone(ticket.customer?.phone) }}
              </div>
              <div class="text-xs italic">
                {{ ESString.formatAddress(ticket.customer!) }}
              </div>
            </td> -->
            <!-- <td>
              <div class="max-line-2">
                {{ ticket.note || '' }}
              </div>
            </td> -->
            <td>
              <div
                v-for="tp in ticket.ticketProcedureList"
                :key="tp.id"
                class="flex flex-wrap gap-2"
              >
                <div class="flex flex-wrap gap-1 items-center">
                  <span>{{ tp.procedure?.name }}</span>
                  <a
                    style="line-height: 0"
                    @click="modalProcedureDetail?.openModal(tp.procedureId)"
                  >
                    <IconFileSearch />
                  </a>
                  <span
                    v-if="tp.procedure?.procedureType === ProcedureType.Regimen"
                    class="font-bold"
                  >
                    ({{ tp.completedSessions }}/{{ tp.totalSessions }} buổi)
                  </span>
                  <div
                    v-if="tp.procedure?.procedureType === ProcedureType.Regimen"
                    @click="modalShowTicketProcedureRegimen?.openModal(tp)"
                    class="font-bold italic underline cursor-pointer"
                    style="color: var(--text-green)"
                  >
                    XEM
                  </div>
                </div>

                <div v-if="tp.procedure?.procedureType === ProcedureType.Regimen">
                  <VueButton
                    v-if="tp.completedSessions < tp.totalSessions"
                    size="small"
                    @click="
                      modalProcessTicketProcedureRegimen?.openModal({
                        ticketProcedure: tp,
                        ticketProcedureItem: tp.ticketProcedureItemList![tp.completedSessions],
                      })
                    "
                  >
                    Thực hiện buổi {{ tp.completedSessions + 1 }}
                    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                      ({{ tp.ticketProcedureItemList![tp.completedSessions]?.id }})
                    </span>
                  </VueButton>
                  <span v-else class="font-bold italic" style="color: var(--text-blue)">
                    HOÀN THÀNH
                  </span>
                </div>
              </div>
            </td>
            <td
              v-for="(roleId, i) in settingStore.TICKET_SPA_LIST.roleIdList"
              :key="i"
              class="text-center"
            >
              {{
                userMap[
                  ticket.ticketUserList?.find((i: TicketUser) => {
                    return i.positionType === PositionInteractType.Ticket && i.roleId === roleId
                  })?.userId || 0
                ]?.fullName
              }}
            </td>
            <td class="text-right">
              <div>{{ formatMoney(ticket.totalMoney) }}</div>
              <div v-if="ticket.status === TicketStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(ticket.debt) }}
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
