<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconFileSearch, IconMore, IconRight, IconSetting } from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { InputCheckbox, InputDate, InputSelect, VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { CustomerService } from '@/modules/customer'
import { DeliveryStatus, PaymentViewType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PositionType } from '@/modules/position'
import { ProcedureType } from '@/modules/procedure'
import { RoleService } from '@/modules/role'
import { Room, RoomService, RoomType } from '@/modules/room'
import { roomTicketPaginationMapRoomId } from '@/modules/room/room.ref'
import { Ticket, TicketActionApi, TicketQueryApi, TicketStatus } from '@/modules/ticket'
import { TicketProcedure } from '@/modules/ticket-procedure'
import { TicketUser } from '@/modules/ticket-user'
import { UserService } from '@/modules/user'
import { ESString, ESTimer, formatPhone } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import InputSearchCustomer from '@/views/component/InputSearchCustomer.vue'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import ModalTicketChangeAllMoney from '@/views/finance/finance-ticket/modal/ModalTicketChangeAllMoney.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import ModalTicketClinicCreate from '@/views/room/room-ticket-reception/create/ModalTicketClinicCreate.vue'
import { onBeforeMount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalTicketClinicPayment from '../../room-ticket-base/ModalTicketPayment.vue'
import TicketLink from '../../room-ticket-base/TicketLink.vue'
import ModalProcessTicketProcedureRegimen from '../../room-procedure/ModalProcessTicketProcedureRegimen.vue'
import ModalShowTicketProcedureRegimen from '../../room-procedure/ModalShowTicketProcedureRegimen.vue'
import { fromTime, toTime } from '../../room-ticket-base/room-ticket.ref'
import ModalTicketClinicListSetting from './ModalTicketClinicListSetting.vue'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketClinicCreate = ref<InstanceType<typeof ModalTicketClinicCreate>>()
const modalTicketClinicListSetting = ref<InstanceType<typeof ModalTicketClinicListSetting>>()

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalProcessTicketProcedureRegimen =
  ref<InstanceType<typeof ModalProcessTicketProcedureRegimen>>()
const modalShowTicketProcedureRegimen = ref<InstanceType<typeof ModalShowTicketProcedureRegimen>>()
const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketChangeAllMoney = ref<InstanceType<typeof ModalTicketChangeAllMoney>>()

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const dataLoading = ref(false)

const roomMap = RoomService.roomMap
const currentRoom = ref<Room>(Room.blank())
const status = ref<TicketStatus | null>(null)

const roleMap = RoleService.roleMap
const userMap = UserService.userMap

const filter = reactive({
  customerId: 0,
  includePendingStatus: settingStore.TICKET_CLINIC_LIST.includePendingStatus,
})

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
        ticketUserList:
          settingStore.TICKET_CLINIC_LIST.roleIdList.length ||
          settingStore.TICKET_CLINIC_LIST.procedure
            ? {}
            : undefined,
        ticketProcedureList: settingStore.TICKET_CLINIC_LIST.procedure
          ? { relation: { ticketProcedureItemList: { imageList: true } } }
          : undefined,
      },
      filter: {
        roomId: currentRoom.value.isCommon ? undefined : currentRoom.value.id || 0,
        customerId: filter.customerId ? filter.customerId : undefined,
        $OR: [
          {
            registeredAt:
              fromTime.value || toTime.value
                ? {
                    GTE: fromTime.value ? fromTime.value : undefined,
                    LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
                  }
                : undefined,
            status: status.value ? status.value : undefined,
          },
          ...(filter.includePendingStatus
            ? [{ status: { NOT_IN: [TicketStatus.Completed] } }]
            : []),
        ],
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            registeredAt: sortColumn.value === 'registeredAt' ? sortValue.value : undefined,
          }
        : { registeredAt: 'DESC' },
    })

    for (let i = 0; i < paginationResult.ticketList.length; i++) {
      const ticketItem = paginationResult.ticketList[i]
      ticketItem.refreshTicketUserTree()
      await ticketItem.refreshProcedure()
    }

    roomTicketPaginationMapRoomId.value[currentRoom.value.id] = paginationResult.ticketList
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

const changeIncludePendingStatus = async (v: number | boolean) => {
  await startFetchData()
}

const handleModalTicketClinicCreateSuccess = async (
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
  ticketId: number,
) => {
  if (type === 'CREATE' && settingStore.TICKET_CLINIC_LIST.goRoomAfterReception) {
    router.push({
      name: 'TicketClinicDetailContainer',
      params: { roomId: currentRoom.value.id, ticketId },
    })
  } else {
    // await startFetchData()
  }
}

const handleModalTicketClinicListSettingSuccess = async () => {
  // await startFetchData()
}

const handleModalTicketChangeAllMoneySuccess = (ticketData: Ticket) => {}

const startCloseTicket = async (ticketId: number) => {
  await TicketActionApi.close({ ticketId })
}

const clickCloseTicket = (ticket: Ticket) => {
  if (ticket.deliveryStatus === DeliveryStatus.Pending) {
    return ModalStore.alert({
      title: 'Thuốc vẫn chưa xuất hết ?',
      content: [
        '- Cần xuất thuốc và vật tư trước khi đóng phiếu khám',
        '- Khách hàng không lấy thuốc có thể chọn số lượng mua = 0',
      ],
    })
  }

  if (ticket.paid > ticket.totalMoney) {
    return ModalStore.alert({
      title: 'Khách hàng còn thừa tiền tạm ứng',
      content: 'Cần hoàn trả tiền thừa trước khi đóng hồ sơ',
    })
  }

  if (ticket.debt) {
    return ModalStore.confirm({
      title: 'Đóng phiếu khám khi khách hàng chưa thanh toán đủ ?',
      content: [
        '- Vẫn đóng phiếu khám.',
        `- Ghi nợ khách hàng: ${formatMoney(ticket?.debt || 0)}.`,
      ],
      okText: 'Xác nhận Đóng phiếu',
      async onOk() {
        await startCloseTicket(ticket.id)
      },
    })
  }

  startCloseTicket(ticket.id)
}

const handleUpdateTicketProcedure = async (data: { ticketProcedure: TicketProcedure }) => {
  const findTicket = roomTicketPaginationMapRoomId.value[currentRoom.value.id].find(
    (i) => i.id === data.ticketProcedure.ticketId,
  )
  if (!findTicket) return

  const findTicketProcedure = findTicket.ticketProcedureList?.find((i) => {
    return i.id === data.ticketProcedure.id
  })
  if (findTicketProcedure) {
    Object.assign(findTicketProcedure, data)
  }
}
</script>

<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalTicketClinicCreate
    ref="modalTicketClinicCreate"
    @success="handleModalTicketClinicCreateSuccess"
  />
  <ModalTicketChangeAllMoney
    ref="modalTicketChangeAllMoney"
    @success="handleModalTicketChangeAllMoneySuccess"
  />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalTicketClinicListSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketClinicListSetting"
    @success="handleModalTicketClinicListSettingSuccess"
  />
  <ModalShowTicketProcedureRegimen
    ref="modalShowTicketProcedureRegimen"
    @success="handleUpdateTicketProcedure"
  />
  <ModalProcessTicketProcedureRegimen
    ref="modalProcessTicketProcedureRegimen"
    @success="handleUpdateTicketProcedure"
  />
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />

  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 text-lg font-medium">
        <Breadcrumb />
        <IconRight style="font-size: 0.7em; opacity: 0.5" />
        {{ currentRoom?.name || '' }}
      </div>
      <div>
        <VueButton
          v-if="userPermission[PermissionId.TICKET_DRAFT_CRUD]"
          color="blue"
          icon="plus"
          @click="
            modalTicketClinicCreate?.openModal({
              roomId: currentRoom.id,
              ticketStatusRegister: TicketStatus.Executing,
            })
          "
        >
          Khám mới
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
          <a @click="modalTicketClinicListSetting?.openModal()">Cài đặt phòng khám</a>
        </div>
      </VueDropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="flex flex-wrap gap-4 px-4 mt-4">
      <div style="flex: 1; flex-basis: 250px">
        <InputSearchCustomer
          v-model:customerId="filter.customerId"
          @selectCustomer="startFilter"
          :editCustomer="false"
        />
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Từ ngày</div>
        <div>
          <InputDate v-model:value="fromTime" type-parser="number" @selectTime="startFilter" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Đến ngày</div>
        <div>
          <InputDate v-model:value="toTime" type-parser="number" @selectTime="startFilter" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="status"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: TicketStatus.Schedule, text: 'Hẹn khám' },
              { value: TicketStatus.Draft, text: 'Chờ khám' },
              { value: TicketStatus.Deposited, text: 'Tạm ứng' },
              { value: TicketStatus.Executing, text: 'Đang khám' },
              { value: TicketStatus.Debt, text: 'Nợ' },
              { value: TicketStatus.Completed, text: 'Hoàn thành' },
            ]"
            @update:value="startFilter"
          />
        </div>
      </div>
    </div>
    <div class="flex justify-end mt-2 px-4">
      <InputCheckbox
        v-model:value="filter.includePendingStatus"
        typeParser="number"
        @update:value="changeIncludePendingStatus"
        label="Bao gồm tất cả phiếu chưa hoàn thành"
      />
    </div>

    <div class="px-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'" class="">Id-RoomId</th>
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
            <th v-if="settingStore.TICKET_CLINIC_LIST.phoneAndAddress" style="white-space: nowrap">
              T.Tin
            </th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.note" style="white-space: nowrap">
              Lý do / Chẩn đoán
            </th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.procedure" style="">Dịch vụ</th>
            <th v-for="(roleId, i) in settingStore.TICKET_CLINIC_LIST.roleIdList" :key="i">
              {{ roleMap[roleId]?.name || '' }}
            </th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.payment"></th>
            <th>Thanh toán</th>
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
          <tr v-if="roomTicketPaginationMapRoomId[currentRoom.id]?.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticket, index) in roomTicketPaginationMapRoomId[currentRoom.id]" :key="index">
            <td v-if="CONFIG.MODE === 'development'" class="text-center" style="color: violet">
              {{ ticket.id }} - {{ ticket.roomId }}
            </td>
            <td>
              <div class="flex gap-4 justify-between items-center">
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
                    modalTicketClinicCreate?.openModal({
                      roomId: ticket.roomId,
                      ticketId: ticket.id,
                    })
                  "
                >
                  <IconEditSquare />
                </a>
              </div>
              <div class="text-xs italic">{{ roomMap[ticket.roomId]?.name || '' }}</div>
            </td>
            <td>
              <div>
                <TicketStatusTag :ticket="ticket" />
              </div>
              <div class="text-xs italic whitespace-nowrap">
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
            <td v-if="settingStore.TICKET_CLINIC_LIST.phoneAndAddress">
              <div v-if="ticket.customer?.phone">
                <a :href="'tel:' + ticket.customer?.phone || ''">
                  {{ ESString.formatPhone(ticket.customer?.phone || '') }}
                </a>
              </div>
              <div class="text-xs italic">
                {{ ESString.formatAddress(ticket.customer!) }}
              </div>
            </td>
            <td v-if="settingStore.TICKET_CLINIC_LIST.note">
              <div class="max-line-2">
                {{ ticket.note || '' }}
              </div>
            </td>
            <td v-if="settingStore.TICKET_CLINIC_LIST.procedure">
              <div
                v-for="tp in ticket.ticketProcedureList"
                :key="tp.id"
                class="flex flex-wrap gap-2"
              >
                <div class="flex flex-wrap gap-1 items-center">
                  <div class="flex items-center gap-1" style="white-space: nowrap">
                    <span>{{ tp.procedure?.name }}</span>
                    <a
                      style="line-height: 0"
                      @click="modalProcedureDetail?.openModal(tp.procedureId)"
                    >
                      <IconFileSearch />
                    </a>
                  </div>

                  <span
                    v-if="tp.procedure?.procedureType === ProcedureType.Regimen"
                    class="font-bold"
                  >
                    ({{ tp.finishedSessions }}/{{ tp.totalSessions }} buổi)
                  </span>
                  <div
                    v-if="tp.procedure?.procedureType === ProcedureType.Regimen"
                    @click="modalShowTicketProcedureRegimen?.openModal({ ticketProcedure: tp })"
                    class="font-bold italic underline cursor-pointer"
                    style="color: var(--text-green)"
                  >
                    XEM KQ
                  </div>
                </div>

                <div v-if="tp.procedure?.procedureType === ProcedureType.Regimen">
                  <VueButton
                    v-if="tp.finishedSessions < tp.totalSessions"
                    size="small"
                    @click="
                      modalProcessTicketProcedureRegimen?.openModal({
                        ticketProcedure: tp,
                        ticketProcedureItem: tp.ticketProcedureItemList![tp.finishedSessions],
                      })
                    "
                  >
                    Thực hiện buổi {{ tp.finishedSessions + 1 }}
                    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                      ({{ tp.ticketProcedureItemList![tp.finishedSessions]?.id }})
                    </span>
                  </VueButton>
                  <span v-else class="font-bold italic" style="color: var(--text-blue)">
                    HOÀN THÀNH
                  </span>
                </div>
              </div>
            </td>
            <td
              v-for="(roleId, i) in settingStore.TICKET_CLINIC_LIST.roleIdList"
              :key="i"
              class="text-left"
            >
              <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                ({{
                  ticket.ticketUserList?.find((i: TicketUser) => {
                    return i.positionType === PositionType.Ticket && i.roleId === roleId
                  })?.userId
                }})
              </span>
              <span>
                {{
                  userMap[
                    ticket.ticketUserList?.find((i: TicketUser) => {
                      return i.positionType === PositionType.Ticket && i.roleId === roleId
                    })?.userId || 0
                  ]?.fullName
                }}
              </span>
            </td>
            <td v-if="settingStore.TICKET_CLINIC_LIST.payment">
              <div class="flex flex-wrap justify-between items-center">
                <VueButton
                  v-if="
                    [
                      TicketStatus.Schedule,
                      TicketStatus.Draft,
                      TicketStatus.Deposited,
                      TicketStatus.Executing,
                    ].includes(ticket.status) && userPermission[PermissionId.TICKET_PAYMENT_MONEY]
                  "
                  size="small"
                  icon="dollar"
                  color="green"
                  @click="
                    modalTicketClinicPayment?.openModal({
                      ticket,
                      paymentView: PaymentViewType.Prepayment,
                    })
                  "
                >
                  <span>Tạm ứng</span>
                </VueButton>
                <VueButton
                  v-if="
                    [TicketStatus.Debt].includes(ticket.status) &&
                    userPermission[PermissionId.TICKET_PAYMENT_MONEY]
                  "
                  size="small"
                  icon="dollar"
                  @click="
                    modalTicketClinicPayment?.openModal({
                      ticket,
                      paymentView: PaymentViewType.PayDebt,
                    })
                  "
                >
                  <span>Trả nợ</span>
                </VueButton>
              </div>
            </td>
            <td class="text-right">
              <div>
                <span
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticket.status) &&
                    ticket.paid != ticket.totalMoney
                  "
                  style="font-weight: 500; color: var(--text-red)"
                >
                  {{ formatMoney(ticket.paid) }} /
                </span>
                <span>
                  {{ formatMoney(ticket.totalMoney) }}
                </span>
              </div>
              <div
                v-if="ticket.status === TicketStatus.Debt"
                class="text-xs"
                style="font-weight: 500; color: var(--text-red)"
              >
                Nợ: {{ formatMoney(ticket.debt) }}
              </div>
            </td>
            <td>
              <div class="flex justify-center items-center">
                <VueDropdown>
                  <template #trigger>
                    <div class="vue-circle" style="width: 26px !important; height: 26px !important">
                      <IconMore style="font-size: 1rem; font-weight: bold" />
                    </div>
                  </template>
                  <div class="vue-menu">
                    <a
                      v-if="userPermission[PermissionId.TICKET_CHANGE_DISCOUNT]"
                      style="color: var(--text-red)"
                      @click="
                        modalTicketChangeAllMoney?.openModal({
                          ticketId: ticket.id,
                          customer: ticket.customer!,
                        })
                      "
                    >
                      Sửa giá tiền và chiết khấu
                    </a>
                    <a
                      v-if="
                        ticket.paid > ticket.totalMoney &&
                        userPermission[PermissionId.TICKET_REFUND_MONEY]
                      "
                      style="color: var(--text-red)"
                      @click="
                        modalTicketClinicPayment?.openModal({
                          ticket,
                          paymentView: PaymentViewType.RefundOverpaid,
                        })
                      "
                    >
                      Hoàn tiền
                    </a>
                    <a
                      v-if="
                        [TicketStatus.Executing].includes(ticket.status) &&
                        userPermission[PermissionId.TICKET_CLOSE]
                      "
                      style="color: var(--text-red)"
                      @click="clickCloseTicket(ticket)"
                    >
                      Đóng phiếu
                    </a>
                  </div>
                </VueDropdown>
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
