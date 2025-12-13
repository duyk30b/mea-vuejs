<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconBug, IconFileSearch, IconMore, IconRight, IconSetting } from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { InputCheckbox, InputDate, InputSelect, VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer, CustomerService } from '@/modules/customer'
import { DeliveryStatus, PaymentViewType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PositionType } from '@/modules/position'
import { RoleService } from '@/modules/role'
import { Room, RoomService, RoomType } from '@/modules/room'
import { roomTicketPaginationMapRoomId } from '@/modules/room/room.ref'
import { Ticket, TicketActionApi, TicketQueryApi, TicketStatus } from '@/modules/ticket'
import { TicketUser } from '@/modules/ticket-user'
import { UserService } from '@/modules/user'
import { ESString, ESTimer } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import InputSearchCustomer from '@/views/component/InputSearchCustomer.vue'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import ModalTicketChangeAllMoney from '@/views/finance/finance-ticket/modal/ModalTicketChangeAllMoney.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import { onBeforeMount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalReceptionCreate from '../../reception/create/ModalReceptionCreate.vue'
import ModalTicketPayment from '../../room-ticket-base/ModalTicketPayment.vue'
import TicketLink from '../../room-ticket-base/TicketLink.vue'
import { fromTime, toTime } from '../../room-ticket-base/room-ticket.ref'
import ModalTicketClinicListSetting from './ModalTicketClinicListSetting.vue'
import { PaymentService } from '@/modules/payment'
import { RegimenService } from '@/modules/regimen'
import { TicketRegimen, TicketRegimenService } from '@/modules/ticket-regimen'
import { VueTooltip } from '@/common/popover'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalReceptionCreate = ref<InstanceType<typeof ModalReceptionCreate>>()
const modalTicketClinicListSetting = ref<InstanceType<typeof ModalTicketClinicListSetting>>()

const modalTicketPayment = ref<InstanceType<typeof ModalTicketPayment>>()
const modalTicketChangeAllMoney = ref<InstanceType<typeof ModalTicketChangeAllMoney>>()

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const dataLoading = ref(false)

const roomMap = RoomService.roomMap
const currentRoom = ref<Room>(Room.blank())

const roleMap = RoleService.roleMap
const userMap = UserService.userMap

const filter = reactive<{
  customerId: number
  filterDateType: 'createdAt' | 'receptionAt'
  status: TicketStatus | null
}>({
  customerId: 0,
  filterDateType: 'receptionAt',
  status: null,
})

const sortColumn = ref<'receptionAt' | 'id' | ''>('')
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
        paymentList: !!settingStore.TICKET_CLINIC_LIST.paymentList,
        ticketReceptionList: true,
        ticketUserList: settingStore.TICKET_CLINIC_LIST.roleIdList.length ? true : undefined,
        ticketRegimenList: settingStore.TICKET_CLINIC_LIST.regimen,
      },
      filter: {
        roomId: currentRoom.value.isCommon ? undefined : currentRoom.value.id || 0,
        customerId: filter.customerId ? filter.customerId : undefined,
        createdAt:
          filter.filterDateType === 'createdAt' && (fromTime.value || toTime.value)
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
        receptionAt:
          filter.filterDateType === 'receptionAt' && (fromTime.value || toTime.value)
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
        status: filter.status ? filter.status : undefined,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            receptionAt: sortColumn.value === 'receptionAt' ? sortValue.value : undefined,
          }
        : { receptionAt: 'DESC' },
    })

    for (let i = 0; i < paginationResult.ticketList.length; i++) {
      const ticketItem = paginationResult.ticketList[i]
      ticketItem.ticketReceptionList?.forEach((tr) => {
        tr.customer = Customer.from(ticketItem.customer)
      })
      await Promise.all([
        PaymentService.refreshRelation(ticketItem.paymentList),
        TicketRegimenService.refreshRelation(ticketItem.ticketRegimenList),
      ])
      ticketItem.refreshTreeData()
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

const changeSort = async (column: 'id' | 'receptionAt') => {
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

const handleModalReceptionCreateSuccess = async (
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
  data: { ticketId: string },
) => {
  if (type === 'CREATE' && settingStore.TICKET_CLINIC_LIST.goRoomAfterReception) {
    router.push({
      name: 'TicketClinicDetailContainer',
      params: { roomId: currentRoom.value.id, ticketId: data.ticketId },
    })
  } else {
    // await startFetchData()
  }
}

const handleModalTicketClinicListSettingSuccess = async () => {
  // await startFetchData()
}

const handleModalTicketChangeAllMoneySuccess = (ticketData: Ticket) => {}

const startCloseTicket = async (ticketId: string) => {
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

  if (ticket.paidAmount > ticket.totalMoney) {
    return ModalStore.alert({
      title: 'Khách hàng còn thừa tiền tạm ứng',
      content: 'Cần hoàn trả tiền thừa trước khi đóng hồ sơ',
    })
  }

  if (ticket.debtAmount) {
    return ModalStore.confirm({
      title: 'Đóng phiếu khám khi khách hàng chưa thanh toán đủ ?',
      content: [
        '- Vẫn đóng phiếu khám.',
        `- Ghi nợ khách hàng: ${formatMoney(ticket.debtAmount)}.`,
      ],
      okText: 'Xác nhận Đóng phiếu',
      async onOk() {
        await startCloseTicket(ticket.id)
      },
    })
  }

  startCloseTicket(ticket.id)
}
</script>

<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalReceptionCreate ref="modalReceptionCreate" @success="handleModalReceptionCreateSuccess" />
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

  <ModalTicketPayment ref="modalTicketPayment" />

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
            modalReceptionCreate?.openModal({
              roomId: currentRoom.id,
              ticketStatusRegister: TicketStatus.Executing,
            })
          "
        >
          TIẾP ĐÓN MỚI
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
            v-model:value="filter.status"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: TicketStatus.Schedule, text: 'Hẹn khám' },
              { value: TicketStatus.Draft, text: 'Chờ khám' },
              { value: TicketStatus.Deposited, text: 'Tạm ứng' },
              { value: TicketStatus.Executing, text: 'Đang điều trị' },
              { value: TicketStatus.Debt, text: 'Nợ' },
              { value: TicketStatus.Completed, text: 'Hoàn thành' },
            ]"
            @update:value="startFilter"
          />
        </div>
      </div>
    </div>
    <div class="mt-4 px-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'" class=""></th>
            <th class="cursor-pointer">
              <div class="flex items-center gap-1 justify-center">
                <span>Hồ Sơ</span>
              </div>
            </th>
            <th class="cursor-pointer">
              <div class="flex items-center gap-1 justify-center">
                <span>T.Thái</span>
              </div>
            </th>
            <th>Thời gian</th>
            <th style="min-width: 150px">Khách hàng</th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.phoneAndAddress" style="white-space: nowrap">
              T.Tin
            </th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.note" style="white-space: nowrap">
              Lý do / Chẩn đoán
            </th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.regimen" style="">Liệu trình</th>
            <th v-for="(roleId, i) in settingStore.TICKET_CLINIC_LIST.roleIdList" :key="i">
              {{ roleMap[roleId]?.name || '' }}
            </th>
            <th>Đã thanh toán</th>
            <th>Tổng tiền</th>
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
          <tr v-if="roomTicketPaginationMapRoomId[currentRoom.id]?.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticket, index) in roomTicketPaginationMapRoomId[currentRoom.id]" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip>
                <template #trigger>
                  <IconBug width="1.2em" height="1.2em" />
                </template>
                <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                  <pre>{{ JSON.stringify(ticket, null, 4) }}</pre>
                </div>
              </VueTooltip>
            </td>
            <td>
              <div class="flex gap-4 justify-between items-center">
                <TicketLink :ticket="ticket" :ticketId="ticket.id" />
              </div>
            </td>
            <td>
              <div>
                <TicketStatusTag :ticket="ticket" />
              </div>
            </td>
            <td style="width: 160px">
              <template v-if="ticket.ticketReceptionList?.length">
                <div
                  v-if="ticket.ticketReceptionList?.length > 4"
                  style="font-size: 0.9em; font-style: italic; color: #555; cursor: pointer"
                >
                  ...Đang điều trị {{ ticket.ticketReceptionList?.length }} buổi
                </div>
                <div
                  v-for="tr in ticket.ticketReceptionList.slice(-4)"
                  :key="tr.id"
                  class="flex flex-nowrap items-center gap-x-2 italic whitespace-nowrap"
                >
                  <span>
                    {{ ESTimer.timeToText(tr.receptionAt, 'hh:mm DD/MM/YYYY') }}
                  </span>
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
                      modalReceptionCreate?.openModal({
                        roomId: ticket.roomId,
                        ticketReception: tr,
                        customer: ticket.customer,
                      })
                    "
                  >
                    <IconEditSquare />
                  </a>
                </div>
              </template>
              <template v-else>
                <div>{{ ESTimer.timeToText(ticket.createdAt, 'hh:mm DD/MM/YYYY') }}</div>
              </template>
            </td>
            <td>
              <div class="">
                <span>{{ ticket.customer?.fullName }}</span>
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
            <td v-if="settingStore.TICKET_CLINIC_LIST.regimen">
              <div v-for="ticketRegimen in ticket.ticketRegimenList" :key="ticketRegimen.id">
                - {{ ticketRegimen.regimen?.name }}
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
                    return i.positionType === PositionType.Reception && i.roleId === roleId
                  })?.userId
                }})
              </span>
              <span>
                {{
                  userMap[
                    ticket.ticketUserList?.find((i: TicketUser) => {
                      return i.positionType === PositionType.Reception && i.roleId === roleId
                    })?.userId || 0
                  ]?.fullName
                }}
              </span>
            </td>
            <td class="text-right">
              <div
                v-if="settingStore.TICKET_CLINIC_LIST.buttonPayment"
                class="flex flex-wrap justify-between items-center"
              >
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
                    modalTicketPayment?.openModal({
                      ticket,
                      paymentView: PaymentViewType.Prepayment,
                    })
                  "
                >
                  <span>Thanh toán</span>
                </VueButton>
                <VueButton
                  v-if="
                    [TicketStatus.Debt].includes(ticket.status) &&
                    userPermission[PermissionId.TICKET_PAYMENT_MONEY]
                  "
                  size="small"
                  icon="dollar"
                  @click="
                    modalTicketPayment?.openModal({
                      ticket,
                      paymentView: PaymentViewType.PayDebt,
                    })
                  "
                >
                  <span>Trả nợ</span>
                </VueButton>
              </div>
              <div v-if="settingStore.TICKET_CLINIC_LIST.paymentList">
                <div v-for="payment in ticket.paymentList" :key="payment.id">
                  {{ payment.wallet?.name }}: {{ formatMoney(payment.paid + payment.paidItem) }}
                </div>
              </div>
              <div v-else>
                <div
                  :style="
                    ticket.paidAmount !== ticket.totalMoney
                      ? 'font-weight: 500; color: var(--text-red)'
                      : ''
                  "
                >
                  {{ formatMoney(ticket.paidAmount) }}
                </div>
                <div
                  v-if="ticket.debtAmount"
                  class="text-xs"
                  style="font-weight: 500; color: var(--text-red)"
                >
                  Nợ: {{ formatMoney(ticket.debtAmount) }}
                </div>
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(ticket.totalMoney) }}
            </td>
            <td></td>
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
                        ticket.paidAmount > ticket.totalMoney &&
                        userPermission[PermissionId.TICKET_REFUND_MONEY]
                      "
                      style="color: var(--text-red)"
                      @click="
                        modalTicketPayment?.openModal({
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
