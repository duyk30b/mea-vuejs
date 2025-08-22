<script setup lang="ts">
import {
  IconDelete,
  IconDownload,
  IconFileSearch,
  IconMore,
  IconPrint,
  IconRight,
  IconSetting,
} from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { AlertStore } from '@/common/vue-alert'
import { InputDate, InputOptions, InputSelect, VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { CustomerService, type Customer } from '@/modules/customer'
import { DeliveryStatus, PaymentViewType } from '@/modules/enum'
import { FileTicketApi } from '@/modules/file-excel/file-ticket.api'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlAction } from '@/modules/print-html'
import { RoleService } from '@/modules/role'
import { Room, RoomInteractType, RoomService, roomTicketPagination } from '@/modules/room'
import {
  Ticket,
  TicketActionApi,
  TicketQueryApi,
  TicketService,
  TicketStatus,
} from '@/modules/ticket'
import { UserService } from '@/modules/user'
import { UserRoleService } from '@/modules/user-role'
import { ESString, ESTimer, formatPhone } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import ModalTicketChangeAllMoney from '@/views/finance/finance-ticket/modal/ModalTicketChangeAllMoney.vue'
import ModalTicketSendProduct from '@/views/room/room-ticket-base/ModalTicketSendProduct.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import { onBeforeMount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalTicketClinicPayment from '../../room-ticket-base/ModalTicketPayment.vue'
import { fromTime, toTime } from '../../room-ticket-base/room-ticket.ref'
import TicketDeliveryStatusTag from '../../room-ticket-base/TicketDeliveryStatusTag.vue'
import ModalTicketClinicCreate from '../create/ModalTicketClinicCreate.vue'
import ModalTicketReceptionListSetting from './ModalTicketReceptionListSetting.vue'
import { watch } from 'vue'
import LinkAndStatusTicket from '../../room-ticket-base/LinkAndStatusTicket.vue'
import TicketLink from '../../room-ticket-base/TicketLink.vue'
import InputSelectRoom from '@/views/component/InputSelectRoom.vue'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketClinicCreate = ref<InstanceType<typeof ModalTicketClinicCreate>>()
const modalTicketReceptionListSetting = ref<InstanceType<typeof ModalTicketReceptionListSetting>>()
const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketChangeAllMoney = ref<InstanceType<typeof ModalTicketChangeAllMoney>>()
const modalTicketSendProduct = ref<InstanceType<typeof ModalTicketSendProduct>>()

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organization } = MeService

const customerList = ref<Customer[]>([])
const dataLoading = ref(false)

const customerId = ref<number>()
const status = ref<TicketStatus | null>(null)

const roomMap = RoomService.roomMap
const currentRoom = ref<Room>(Room.blank())

const filter = reactive({ roomId: 0 })

const sortColumn = ref<'registeredAt' | 'id' | ''>('')
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
        ticketUserList: settingStore.TICKET_CLINIC_LIST.roleIdList.length ? {} : false,
      },
      filter: {
        roomId: filter.roomId ? filter.roomId : undefined,
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

    roomTicketPagination.value[currentRoom.value.id] = paginationResult.ticketList
    total.value = paginationResult.total
  } catch (error) {
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
      currentRoom.value.roomInteractType = RoomInteractType.Ticket
    }
    startFetchData()
  },
  { immediate: true },
)

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

const handleModalTicketClinicCreateSuccess = () => {
  // await startFetchData()
}

const handleModalTicketReceptionListSettingSuccess = async () => {
  // await startFetchData()
}

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

const handleClickDestroy = async (ticketId: number) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa lượt khám này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        roomTicketPagination.value[currentRoom.value.id] = roomTicketPagination.value[
          currentRoom.value.id
        ].filter((i) => {
          return i.id === ticketId
        })
        await TicketActionApi.destroy(ticketId)
        AlertStore.addSuccess('Xóa phiếu khám thành công')
      } catch (error) {}
      await startFetchData()
    },
  })
}

const handleModalTicketChangeAllMoneySuccess = (ticketData: Ticket) => {}

const startPrintAllMoney = async (options: { ticketId: number }) => {
  const ticketData = await TicketService.detail(options.ticketId, {
    relation: {
      customer: true,
      ticketProcedureList: {},
      ticketProductConsumableList: {},
      ticketProductPrescriptionList: {},
      ticketLaboratoryList: {},
      ticketLaboratoryGroupList: {},
      ticketRadiologyList: {},
    },
  })
  if (!ticketData.ticketProcedureList) ticketData.ticketProcedureList = []
  if (!ticketData.ticketProductConsumableList) ticketData.ticketProductConsumableList = []
  if (!ticketData.ticketProductPrescriptionList) ticketData.ticketProductPrescriptionList = []
  if (!ticketData.ticketRadiologyList) ticketData.ticketRadiologyList = []
  if (!ticketData.ticketLaboratoryList) ticketData.ticketLaboratoryList = []
  await ticketData.refreshAllData()

  await PrintHtmlAction.startPrintAllMoney({
    ticket: ticketData,
    customer: ticketData.customer!,
  })
}
</script>

<template>
  <ModalTicketClinicCreate
    ref="modalTicketClinicCreate"
    @success="handleModalTicketClinicCreateSuccess"
  />
  <ModalTicketChangeAllMoney
    ref="modalTicketChangeAllMoney"
    @success="handleModalTicketChangeAllMoneySuccess"
  />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalTicketReceptionListSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketReceptionListSetting"
    @success="handleModalTicketReceptionListSettingSuccess"
  />
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />
  <ModalTicketSendProduct ref="modalTicketSendProduct" />

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
              ticketStatusRegister: TicketStatus.Draft,
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
          <a @click="modalTicketReceptionListSetting?.openModal()">Cài đặt tiếp đón</a>
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
        <InputSelectRoom
          v-model:roomId="filter.roomId"
          :roomInteractType="RoomInteractType.Ticket"
          @update:roomId="startFilter"
        />
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Chọn trạng thái</div>
        <div>
          <InputSelect
            v-model:value="status"
            :options="[
              { value: null, label: 'Tất cả' },
              { value: TicketStatus.Schedule, label: 'Hẹn' },
              { value: TicketStatus.Draft, label: 'Chờ (Nháp)' },
              { value: TicketStatus.Deposited, label: 'Tạm ứng' },
              { value: TicketStatus.Executing, label: 'Đang xử lý' },
              { value: TicketStatus.Debt, label: 'Nợ' },
              { value: TicketStatus.Completed, label: 'Hoàn thành' },
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
            <th v-if="CONFIG.MODE === 'development'">ID-RoomID</th>
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
                <span>Trạng thái</span>
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
            <th>T.Tin</th>
            <th class="">Thuốc - Vật tư</th>
            <th>Thanh toán</th>
            <th>Tổng tiền</th>
            <th></th>
            <th>In</th>
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
          <tr v-if="roomTicketPagination[currentRoom.id]?.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="ticket in roomTicketPagination[currentRoom.id]" :key="ticket.id">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
              {{ ticket.id }} - {{ ticket.roomId }}
            </td>
            <td class="">
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
              <div><TicketStatusTag :ticket="ticket" /></div>
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
            <td>
              <div>
                {{ formatPhone(ticket.customer?.phone) }}
              </div>
              <div class="text-xs italic">
                {{ ESString.formatAddress(ticket.customer!) }}
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
              <div class="flex flex-wrap justify-between items-center">
                <div
                  v-if="ticket.paid > ticket.totalMoney"
                  style="font-weight: 500; color: var(--text-green)"
                >
                  {{ formatMoney(ticket.paid) }}
                </div>
                <div v-else>{{ formatMoney(ticket.paid) }}</div>
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
              <div>{{ formatMoney(ticket.totalMoney) }}</div>
              <div v-if="ticket.status === TicketStatus.Debt" class="text-xs">
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
            <td>
              <div class="flex justify-center items-center">
                <VueDropdown>
                  <template #trigger>
                    <IconPrint
                      style="
                        font-size: 18px;
                        font-weight: bold;
                        color: var(--text-blue);
                        cursor: pointer;
                      "
                    />
                  </template>
                  <div class="vue-menu">
                    <a
                      @click="
                        startPrintAllMoney({
                          ticketId: ticket.id,
                        })
                      "
                    >
                      In bảng kê chi phí
                    </a>
                  </div>
                </VueDropdown>
              </div>
            </td>
            <td>
              <a
                v-if="
                  [TicketStatus.Schedule, TicketStatus.Draft].includes(ticket.status) &&
                  userPermission[PermissionId.TICKET_DRAFT_CRUD]
                "
                style="color: var(--text-red)"
                class="text-xl"
                @click="handleClickDestroy(ticket.id)"
              >
                <IconDelete width="18" height="18" />
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
