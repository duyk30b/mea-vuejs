<script setup lang="ts">
import {
  IconDelete,
  IconDownload,
  IconFileSearch,
  IconMore,
  IconPrint,
  IconSetting,
} from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { InputDate, InputOptions, InputSelect, VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { CustomerService, type Customer } from '@/modules/customer'
import { DeliveryStatus, PaymentViewType } from '@/modules/enum'
import { FileTicketApi } from '@/modules/file-excel/file-ticket.api'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Role, RoleService } from '@/modules/role'
import {
  Ticket,
  TicketActionApi,
  TicketQueryApi,
  TicketService,
  TicketStatus,
  TicketType,
} from '@/modules/ticket'
import { User, UserService } from '@/modules/user'
import ModalTicketSendProduct from '@/views/ticket-base/ModalTicketSendProduct.vue'
import TicketClinicDeliveryStatusTag from '@/views/ticket-clinic/TicketClinicDeliveryStatusTag.vue'
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ESString, ESTimer, formatPhone } from '../../../utils'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketStatusTag from '../../ticket-base/TicketStatusTag.vue'
import ModalTicketClinicCreate from './create/ModalTicketClinicCreate.vue'
import ModalTicketClinicPayment from './modal/ModalTicketClinicPayment.vue'
import ModalReceptionTicketListSetting from './ModalReceptionTicketListSetting.vue'
import { fromTime, toTime } from './reception-ticket-list.ref'
import { IconEditSquare } from '@/common/icon-google'
import { roomReceptionPagination, RoomService } from '@/modules/room'
import { AlertStore } from '@/common/vue-alert'
import { CONFIG } from '@/config'
import { PrintHtmlAction } from '@/modules/print-html'
import { UserRoleService } from '@/modules/user-role'
import ModalTicketChangeAllMoney from '@/views/finance/finance-ticket/modal/ModalTicketChangeAllMoney.vue'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketClinicCreate = ref<InstanceType<typeof ModalTicketClinicCreate>>()
const modalTicketClinicListSetting = ref<InstanceType<typeof ModalReceptionTicketListSetting>>()
const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketChangeAllMoney = ref<InstanceType<typeof ModalTicketChangeAllMoney>>()
const modalTicketSendProduct = ref<InstanceType<typeof ModalTicketSendProduct>>()

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organization } = MeService

const customerList = ref<Customer[]>([])
const dataLoading = ref(false)

const customerId = ref<number>()
const status = ref<TicketStatus | null>(null)
const customType = ref<number | null>(null)

const roleMap = RoleService.roleMap
const userMap = UserService.userMap
const roomMap = RoomService.roomMap

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
        customerId: customerId.value ? customerId.value : undefined,
        registeredAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
        status: status.value ?? undefined,
        ticketType: { NOT: TicketType.Order },
        customType: customType.value == null ? undefined : customType.value,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            registeredAt: sortColumn.value === 'registeredAt' ? sortValue.value : undefined,
          }
        : { registeredAt: 'DESC' },
    })

    roomReceptionPagination.value = paginationResult.ticketList
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

const handleModalReceptionTicketListSettingSuccess = async () => {
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
        roomReceptionPagination.value = roomReceptionPagination.value.filter((i) => {
          return i.id === ticketId
        })
        await TicketActionApi.destroy(ticketId)
        AlertStore.addSuccess('Xóa phiếu khám thành công')
      } catch (error) {}
      await startFetchData()
    },
  })
}

const downloadTicketClinicList = (menu: { key: string }) => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await FileTicketApi.downloadExcelTicketClinicList({
        filter: {
          customerId: customerId.value ? customerId.value : undefined,
          registeredAt:
            fromTime.value || toTime.value
              ? {
                  GTE: fromTime.value ? fromTime.value : undefined,
                  LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
                }
              : undefined,
          status: status.value ?? undefined,
          ticketType: { NOT: TicketType.Order },
          customType: customType.value == null ? undefined : customType.value,
        },
        sort: sortValue.value
          ? {
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              registeredAt: sortColumn.value === 'registeredAt' ? sortValue.value : undefined,
            }
          : { registeredAt: 'DESC' },
      })
    },
  })
}

const handleModalTicketChangeAllMoneySuccess = (ticketData: Ticket) => {}

const startPrintAllItemAndMoney = async (options: { ticketId: number }) => {
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

  await PrintHtmlAction.startPrintRequestInvoice({
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
  <ModalReceptionTicketListSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketClinicListSetting"
    @success="handleModalReceptionTicketListSettingSuccess"
  />
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />
  <ModalTicketSendProduct ref="modalTicketSendProduct" />

  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:block">
        <Breadcrumb />
      </div>
      <div>
        <VueButton
          v-if="userPermission[PermissionId.RECEPTION_CRUD_TICKET_DRAFT]"
          color="blue"
          icon="plus"
          @click="
            modalTicketClinicCreate?.openModal({
              roomId: 0,
              ticketStatusRegister: TicketStatus.Draft,
            })
          "
        >
          TIẾP ĐÓN MỚI
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
      <div>
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_DOWNLOAD_TICKET_CLINIC]"
          :icon="IconDownload"
          @click="downloadTicketClinicList"
        >
          Download
        </VueButton>
      </div>
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a @click="modalTicketClinicListSetting?.openModal()">Cài đặt tiếp đón</a>
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

      <div v-if="settingStore.TICKET_CLINIC_LIST.showCustomType" style="flex: 1; flex-basis: 150px">
        <div>Phân loại</div>
        <div>
          <InputSelect
            v-model:value="customType"
            :options="[
              { value: null, label: 'Tất cả' },
              ...settingStore.TICKET_CLINIC_LIST.customTypeText.map((i, index) => {
                return { value: index, label: i }
              }),
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
            <th v-if="settingStore.TICKET_CLINIC_LIST.showCustomType">Phân loại</th>
            <th style="min-width: 150px">Khách hàng</th>
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
          <tr v-if="roomReceptionPagination.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticket, index) in roomReceptionPagination" :key="index">
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
                        ticket.date?.toString().padStart(2, '0') +
                        ticket.month?.toString().padStart(2, '0') +
                        ticket.year?.toString().slice(-2) +
                        '_' +
                        ticket.dailyIndex?.toString().padStart(2, '0')
                      }}
                    </span>
                  </div>
                </router-link>
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
              <div>{{ roomMap[ticket.roomId]?.name || '' }}</div>
            </td>
            <td>
              <div><TicketStatusTag :ticket="ticket" /></div>
              <div>{{ ESTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}</div>
            </td>
            <td
              v-if="settingStore.TICKET_CLINIC_LIST.showCustomType"
              style="font-size: 1em; color: #555"
            >
              {{ settingStore.TICKET_CLINIC_LIST.customTypeText[ticket.customType || 0] }}
            </td>
            <td>
              <div>
                {{ ticket.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(ticket.customerId)">
                  <IconFileSearch />
                </a>
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
                - {{ ticket.customer?.getAge ? ticket.customer?.getAge + ' Tuổi' : '' }}
              </div>
              <div>
                {{ formatPhone(ticket.customer?.phone) }}
              </div>
            </td>

            <td>
              <div class="flex flex-wrap justify-between items-center">
                <TicketClinicDeliveryStatusTag :deliveryStatus="ticket.deliveryStatus" />
                <VueButton
                  v-if="
                    ticket.deliveryStatus === DeliveryStatus.Pending &&
                    userPermission[PermissionId.PRODUCT_SEND_PRODUCT]
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
                <div>{{ formatMoney(ticket.paid) }}</div>
                <VueButton
                  v-if="
                    [
                      TicketStatus.Schedule,
                      TicketStatus.Draft,
                      TicketStatus.Deposited,
                      TicketStatus.Executing,
                    ].includes(ticket.status) &&
                    userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT]
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
                    userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT]
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
                      v-if="userPermission[PermissionId.PAYMENT_CHANGE_DISCOUNT_TICKET]"
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
                        userPermission[PermissionId.PAYMENT_CUSTOMER_REFUND]
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
                        userPermission[PermissionId.RECEPTION_CLOSE_TICKET]
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
                        startPrintAllItemAndMoney({
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
                  userPermission[PermissionId.RECEPTION_DESTROY_TICKET]
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
