<script setup lang="ts">
import { FileSearchOutlined, ReadOutlined, ScheduleOutlined } from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconSetting } from '../../../common/icon'
import { IconEditSquare } from '../../../common/icon-google'
import { InputDate, InputOptions, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { InteractType } from '../../../modules/commission'
import { CustomerService, type Customer } from '../../../modules/customer'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Role, RoleService } from '../../../modules/role'
import { Ticket, TicketApi, TicketStatus, TicketType } from '../../../modules/ticket'
import { ticketClinicPagination } from '../../../modules/ticket-clinic'
import { User, UserService } from '../../../modules/user'
import { DString, DTimer, formatPhone } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketClinicStatusTag from '../TicketClinicStatusTag.vue'
import ModalTicketClinicCreate from '../create/ModalTicketClinicCreate.vue'
import ModalTicketClinicCommission from './ModalTicketClinicCommission.vue'
import ModalTicketClinicListSetting from './ModalTicketClinicListSetting.vue'
import { fromTime, toTime } from './ticket-clinic-list.ref'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketClinicCreate = ref<InstanceType<typeof ModalTicketClinicCreate>>()
const modalTicketClinicListSetting = ref<InstanceType<typeof ModalTicketClinicListSetting>>()
const modalTicketClinicCommission = ref<InstanceType<typeof ModalTicketClinicCommission>>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const customerList = ref<Customer[]>([])
const dataLoading = ref(false)

const customerId = ref<number>()
const ticketStatus = ref<TicketStatus | null>(null)
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
        ticketAttributeList: true,
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
        ticketStatus: ticketStatus.value ?? undefined,
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
    CustomerService.refreshDB(),
    startFetchData(),
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

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('TICKET_CLINIC_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'SCREEN_SETTING') {
    modalTicketClinicListSetting.value?.openModal()
  }
  if (menu.key === 'ROLE_AND_COMMISSION') {
    modalTicketClinicCommission.value?.openModal()
  }
}

const handleModalTicketClinicCreateSuccess = () => {
  // await startFetchData()
}

const handleModalTicketClinicListSettingSuccess = async () => {
  // await startFetchData()
}
</script>

<template>
  <ModalTicketClinicCreate
    ref="modalTicketClinicCreate"
    @success="handleModalTicketClinicCreateSuccess" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalTicketClinicListSetting
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketClinicListSetting"
    @success="handleModalTicketClinicListSettingSuccess" />
  <ModalTicketClinicCommission ref="modalTicketClinicCommission" />
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div
        class="hidden md:block"
        style="font-size: 1.25rem; font-weight: 500; line-height: 1.75rem">
        <ScheduleOutlined class="mr-1" />
        Danh sách khám
      </div>
      <div>
        <VueButton
          v-if="
            permissionIdMap[PermissionId.TICKET_CLINIC_CREATE] &&
            settingStore.TICKET_CLINIC_LIST.buttonShowModalCreate
          "
          color="blue"
          icon="plus"
          @click="modalTicketClinicCreate?.openModal()">
          TIẾP ĐÓN
        </VueButton>
      </div>
      <div>
        <VueButton
          v-if="
            permissionIdMap[PermissionId.TICKET_CLINIC_CREATE] &&
            settingStore.TICKET_CLINIC_LIST.buttonShowTicketDetailBlank
          "
          color="blue"
          icon="plus"
          @click="$router.push({ name: 'TicketClinicDetailContainer', params: { id: 0 } })">
          KHÁM MỚI
        </VueButton>
      </div>
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer">
          <IconSetting />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="SCREEN_SETTING">Cài đặt phòng khám</a-menu-item>
            <a-menu-item key="ROLE_AND_COMMISSION">Vai trò và hoa hồng</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
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
            @update:text="searchingCustomer">
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ data.phone }} -
                {{ DTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
              </div>
              <div>
                {{ data.addressWard }} - {{ data.addressDistrict }} - {{ data.addressProvince }}
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
            @selectTime="startFilter" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Đến ngày</div>
        <div>
          <InputDate
            v-model:value="toTime"
            type-parser="number"
            class="w-full"
            @selectTime="startFilter" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="ticketStatus"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: TicketStatus.Schedule, text: 'Hẹn khám' },
              { value: TicketStatus.Draft, text: 'Chờ khám' },
              { value: TicketStatus.Approved, text: 'Tạm ứng' },
              { value: TicketStatus.Executing, text: 'Đang khám' },
              { value: TicketStatus.Debt, text: 'Nợ' },
              { value: TicketStatus.Completed, text: 'Hoàn thành' },
            ]"
            @update:value="startFilter" />
        </div>
      </div>

      <div v-if="settingStore.TICKET_CLINIC_LIST.showCustomType" style="flex: 1; flex-basis: 150px">
        <div>Phân loại</div>
        <div>
          <VueSelect
            v-model:value="customType"
            :options="[
              { value: null, text: 'Tất cả' },
              ...settingStore.TICKET_CLINIC_LIST.customTypeText.map((i, index) => {
                return { value: index, text: i }
              }),
            ]"
            @update:value="startFilter" />
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
              Hồ Sơ &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'id'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.showCustomType">Phân loại</th>
            <th class="">Trạng thái</th>
            <th class="cursor-pointer" @click="changeSort('registeredAt')">
              Thời gian &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'id'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th style="min-width: 150px">Khách hàng</th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.birthday">Ngày sinh</th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.phone">SĐT</th>
            <th v-if="settingStore.TICKET_CLINIC_LIST.address">Địa chỉ</th>
            <th style="white-space: nowrap">Lý do / Chẩn đoán</th>
            <th v-for="(roleId, i) in settingStore.TICKET_CLINIC_LIST.roleIdList" :key="i">
              {{ roleMap[roleId]?.displayName || roleMap[roleId]?.name || '' }}
            </th>
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
          <tr v-if="ticketClinicPagination.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticket, index) in ticketClinicPagination" :key="index">
            <td class="text-center">
              <div class="flex gap-4 justify-center">
                <router-link
                  :to="{ name: 'TicketClinicDetailContainer', params: { id: ticket.id } }">
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
                    <span class="text-lg"><ReadOutlined /></span>
                  </div>
                </router-link>
              </div>
            </td>
            <td v-if="settingStore.TICKET_CLINIC_LIST.showCustomType">
              {{ settingStore.TICKET_CLINIC_LIST.customTypeText[ticket.customType || 0] }}
            </td>
            <td class="text-center">
              <div>
                <TicketClinicStatusTag :ticketStatus="ticket.ticketStatus" />
              </div>
            </td>
            <td class="text-center">
              {{ DTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td>
              <div>
                {{ ticket.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(ticket.customerId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="ticket.customer?.note" class="text-xs italic">
                {{ ticket.customer?.note }}
              </div>
            </td>

            <td v-if="settingStore.TICKET_CLINIC_LIST.birthday" class="text-center">
              {{
                DTimer.timeToText(ticket.customer?.birthday, 'DD/MM/YYYY') ||
                ticket.customer?.yearOfBirth ||
                ''
              }}
            </td>
            <td v-if="settingStore.TICKET_CLINIC_LIST.phone" class="text-center">
              {{ formatPhone(ticket.customer?.phone) }}
            </td>
            <td v-if="settingStore.TICKET_CLINIC_LIST.address">
              {{ DString.formatAddress(ticket.customer!) }}
            </td>
            <td>
              {{ ticket.ticketAttributeMap?.diagnosis || ticket.ticketAttributeMap?.reason || '' }}
            </td>
            <td
              v-for="(roleId, i) in settingStore.TICKET_CLINIC_LIST.roleIdList"
              :key="i"
              class="text-center">
              {{
                userMap[
                  ticket.ticketUserList?.find((i) => {
                    return i.interactType === InteractType.Ticket && i.roleId === roleId
                  })?.userId || 0
                ]?.fullName
              }}
            </td>
            <td class="text-center">
              {{ formatMoney(ticket.paid) }} / {{ formatMoney(ticket.totalMoney) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  [
                    TicketStatus.Schedule,
                    TicketStatus.Draft,
                    TicketStatus.Approved,
                    TicketStatus.Executing,
                  ].includes(ticket.ticketStatus)
                "
                style="color: #eca52b"
                class="text-xl"
                @click="modalTicketClinicCreate?.openModal(ticket.id)">
                <IconEditSquare />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="my-4 flex gap-4 justify-between">
        <div class="">Tổng: {{ total }}</div>
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
