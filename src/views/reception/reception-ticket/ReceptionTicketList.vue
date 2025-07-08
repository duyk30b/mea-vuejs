<script setup lang="ts">
import { IconFileSearch, IconMore, IconSetting } from '@/common/icon-antd'
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
import { Ticket, TicketApi, TicketStatus, TicketType } from '@/modules/ticket'
import { TicketClinicApi, ticketClinicPagination } from '@/modules/ticket-clinic'
import { User, UserService } from '@/modules/user'
import ModalTicketSendProduct from '@/views/ticket-base/ModalTicketSendProduct.vue'
import TicketClinicDeliveryStatusTag from '@/views/ticket-clinic/TicketClinicDeliveryStatusTag.vue'
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DString, ESTimer, formatPhone } from '../../../utils'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketStatusTag from '../../ticket-base/TicketStatusTag.vue'
import ModalTicketClinicCreate from './create/ModalTicketClinicCreate.vue'
import ModalTicketClinicPayment from './modal/ModalTicketClinicPayment.vue'
import ModalReceptionTicketListSetting from './ModalReceptionTicketListSetting.vue'
import { fromTime, toTime } from './reception-ticket-list.ref'
import { IconEditSquare } from '@/common/icon-google'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketClinicCreate = ref<InstanceType<typeof ModalTicketClinicCreate>>()
const modalTicketClinicListSetting = ref<InstanceType<typeof ModalReceptionTicketListSetting>>()
const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketSendProduct = ref<InstanceType<typeof ModalTicketSendProduct>>()

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const customerList = ref<Customer[]>([])
const dataLoading = ref(false)

const customerId = ref<number>()
const status = ref<TicketStatus | null>(null)
const customType = ref<number | null>(null)

const roleMap = ref<Record<string, Role>>({})
const userMap = ref<Record<string, User>>({})

const sortColumn = ref<'registeredAt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(Number(localStorage.getItem('TICKET_CLINIC_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await TicketApi.pagination({
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

    ticketClinicPagination.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicList.vue:84 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  Promise.all([
    RoleService.getMap(),
    UserService.getMap(),
    startFetchData(),
    CustomerService.refreshDB(),
  ])
    .then((result) => {
      roleMap.value = result[0]
      userMap.value = result[1]
    })
    .catch((e) => {
      console.log('🚀 ~ file: ModalTicketClinicCreate.vue ~ openModal 105 ~ e:', e)
    })
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
  await TicketClinicApi.close(ticketId)
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
</script>

<template>
  <ModalTicketClinicCreate
    ref="modalTicketClinicCreate"
    @success="handleModalTicketClinicCreateSuccess"
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
          color="blue"
          icon="plus"
          @click="modalTicketClinicCreate?.openModal({ ticketStatusRegister: TicketStatus.Draft })"
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
            <th v-if="settingStore.TICKET_CLINIC_LIST.showCustomType">Phân loại</th>
            <th class="">Trạng thái</th>

            <th class="cursor-pointer" @click="changeSort('registeredAt')">
              <div class="flex items-center gap-1 justify-center">
                <span>Thời gian</span>
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
            <th v-if="settingStore.TICKET_CLINIC_LIST.birthday">Ngày sinh</th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.phone">SĐT</th>
            <th class="">Thuốc - Vật tư</th>
            <th>Thanh toán</th>
            <th>Tổng tiền</th>
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
          <tr v-if="ticketClinicPagination.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticket, index) in ticketClinicPagination" :key="index">
            <td class="text-center">
              <div class="flex gap-1 justify-between items-center">
                <span>
                  {{
                    ticket.date?.toString().padStart(2, '0') +
                    ticket.month?.toString().padStart(2, '0') +
                    ticket.year?.toString().slice(-2) +
                    '_' +
                    ticket.dailyIndex?.toString().padStart(2, '0')
                  }}
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
                  @click="modalTicketClinicCreate?.openModal({ ticketId: ticket.id })"
                >
                  <IconEditSquare />
                </a>
              </div>
            </td>
            <td
              v-if="settingStore.TICKET_CLINIC_LIST.showCustomType"
              style="font-size: 1em; color: #555"
            >
              {{ settingStore.TICKET_CLINIC_LIST.customTypeText[ticket.customType || 0] }}
            </td>
            <td><TicketStatusTag :ticket="ticket" /></td>

            <td class="text-center">
              {{ ESTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
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
                {{ DString.formatAddress(ticket.customer!) }}
              </div>
            </td>

            <td v-if="settingStore.TICKET_CLINIC_LIST.birthday" class="text-center">
              {{
                ESTimer.timeToText(ticket.customer?.birthday, 'DD/MM/YYYY') ||
                ticket.customer?.yearOfBirth ||
                ''
              }}
            </td>
            <td v-if="settingStore.TICKET_CLINIC_LIST.phone" class="text-center">
              {{ formatPhone(ticket.customer?.phone) }}
            </td>
            <td>
              <div class="flex flex-wrap justify-between items-center">
                <TicketClinicDeliveryStatusTag :deliveryStatus="ticket.deliveryStatus" />
                <VueButton
                  v-if="ticket.deliveryStatus === DeliveryStatus.Pending"
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
                    ].includes(ticket.status)
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
                  v-if="[TicketStatus.Debt].includes(ticket.status)"
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
                    <div class="vue-circle">
                      <IconMore style="font-size: 1.2rem; font-weight: bold" />
                    </div>
                  </template>
                  <div class="vue-menu">
                    <a
                      v-if="
                        [TicketStatus.Deposited, TicketStatus.Executing].includes(ticket.status) &&
                        ticket.paid > ticket.totalMoney
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
                      v-if="[TicketStatus.Executing].includes(ticket.status)"
                      style="color: var(--text-red)"
                      @click="modalTicketClinicCreate?.openModal({ ticketId: ticket.id })"
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
