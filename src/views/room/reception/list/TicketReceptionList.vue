<script setup lang="ts">
import { IconDelete, IconFileSearch, IconSetting } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { AlertStore } from '@/common/vue-alert'
import { InputDate, InputSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { RoomService, RoomType } from '@/modules/room'
import { Ticket, TicketActionApi, TicketChangeReceptionApi, TicketStatus } from '@/modules/ticket'
import { TicketReceptionApi, type TicketReception } from '@/modules/ticket-reception'
import { ESString, ESTimer } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import InputSearchCustomer from '@/views/component/InputSearchCustomer.vue'
import InputSelectRoom from '@/views/component/InputSelectRoom.vue'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import ModalTicketChangeAllMoney from '@/views/finance/finance-ticket/modal/ModalTicketChangeAllMoney.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import { onBeforeMount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalTicketClinicPayment from '../../room-ticket-base/ModalTicketPayment.vue'
import TicketLink from '../../room-ticket-base/TicketLink.vue'
import ModalReceptionCreate from '../create/ModalReceptionCreate.vue'
import ModalReceptionListSetting from './ModalReceptionListSetting.vue'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalReceptionCreate = ref<InstanceType<typeof ModalReceptionCreate>>()
const modalReceptionListSetting = ref<InstanceType<typeof ModalReceptionListSetting>>()
const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketChangeAllMoney = ref<InstanceType<typeof ModalTicketChangeAllMoney>>()

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organization } = MeService

const roomMap = RoomService.roomMap

const startDate = ESTimer.startOfDate(new Date())

const filter = reactive({
  customerId: 0,
  roomId: 0,
  fromTime: startDate.getTime(),
  toTime: null,
})

const dataLoading = ref(false)
const ticketReceptionList = ref<TicketReception[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const paginationResult = await TicketReceptionApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        customer: true,
        ticket: true,
      },
      filter: {
        roomId: filter.roomId ? filter.roomId : undefined,
        customerId: filter.customerId ? filter.customerId : undefined,
        receptionAt:
          filter.fromTime || filter.toTime
            ? {
                GTE: filter.fromTime ? filter.fromTime : undefined,
                LT: filter.toTime ? filter.toTime + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
      },
      sort: { receptionAt: 'DESC' },
    })

    ticketReceptionList.value = paginationResult.ticketReceptionList
    total.value = paginationResult.total
  } catch (error) {
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

const startFilter = async () => {
  page.value = 1
  await startFetchData()
}

const changePage = async (pageSelect: number) => {
  await startFetchData()
}
const changeLimit = async (limitSelect: any) => {
  limit.value = limitSelect
  localStorage.setItem('TICKET_CLINIC_PAGINATION_LIMIT', String(limitSelect))
  await startFetchData()
}

const handleModalReceptionCreateSuccess = async () => {
  await startFetchData()
}

const handleModalReceptionListSettingSuccess = async () => {
  // await startFetchData()
}

const handleClickDestroy = async (obj: { ticketId: string; ticketReceptionId: string }) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa phiếu tiếp đón này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await TicketChangeReceptionApi.destroyTicketReception({
          ticketId: obj.ticketId,
          ticketReceptionId: obj.ticketReceptionId,
        })
        AlertStore.addSuccess('Xóa phiếu tiếp đón thành công')
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ TicketReceptionList.vue:181 ~ handleClickDestroy ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <ModalReceptionCreate ref="modalReceptionCreate" @success="handleModalReceptionCreateSuccess" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalReceptionListSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalReceptionListSetting"
    @success="handleModalReceptionListSettingSuccess"
  />

  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 text-lg font-medium">
        <Breadcrumb />
      </div>
      <div>
        <VueButton color="blue" icon="plus" @click="modalReceptionCreate?.openModal({})">
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
          <a @click="modalReceptionListSetting?.openModal()">Cài đặt tiếp đón</a>
        </div>
      </VueDropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
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
          <InputDate
            v-model:value="filter.fromTime"
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
            v-model:value="filter.toTime"
            type-parser="number"
            class="w-full"
            @selectTime="startFilter"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <InputSelectRoom
          v-model:roomId="filter.roomId"
          :roomType="RoomType.Ticket"
          @update:roomId="startFilter"
        />
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID-RoomID</th>
            <th class="cursor-pointer">
              <div class="flex items-center gap-1 justify-center">
                <span>Hồ Sơ</span>
              </div>
            </th>
            <th class="cursor-pointer">
              <div class="flex items-center gap-1 justify-center">
                <span>Trạng thái</span>
              </div>
            </th>
            <th style="min-width: 150px">Khách hàng</th>
            <th>T.Tin</th>
            <th>Lý do</th>
            <th>Thanh toán</th>
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
          <tr v-if="ticketReceptionList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="ticketReception in ticketReceptionList" :key="ticketReception.id">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
              {{ ticketReception.id }} - {{ ticketReception.roomId }}
            </td>
            <td class="">
              <template v-if="ticketReception?.ticket?.roomId">
                <div v-if="ticketReception.ticket">
                  <TicketLink
                    :ticket="ticketReception.ticket"
                    :ticketId="ticketReception.ticketId"
                  />
                </div>
                <div class="text-xs italic">{{ roomMap[ticketReception.roomId]?.name || '' }}</div>
              </template>
            </td>
            <td>
              <div><TicketStatusTag :ticket="ticketReception.ticket" /></div>
              <div class="text-xs italic">
                {{ ESTimer.timeToText(ticketReception.receptionAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <div>
                {{ ticketReception.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(ticketReception.customerId)">
                  <IconFileSearch />
                </a>
              </div>
              <div class="text-xs italic">
                {{
                  ESTimer.timeToText(ticketReception.customer?.birthday, 'DD/MM/YYYY') ||
                  ticketReception.customer?.yearOfBirth ||
                  ''
                }}
                -
                {{
                  ticketReception.customer?.getAge ? ticketReception.customer?.getAge + ' Tuổi' : ''
                }}
              </div>
              <div v-if="ticketReception.customer?.note" class="text-xs italic">
                {{ ticketReception.customer?.note }}
              </div>
            </td>
            <td>
              <div v-if="ticketReception.customer?.phone">
                <a :href="'tel:' + ticketReception.customer?.phone || ''">
                  {{ ESString.formatPhone(ticketReception.customer?.phone || '') }}
                </a>
              </div>
              <div class="text-xs italic">
                {{ ESString.formatAddress(ticketReception.customer!) }}
              </div>
            </td>
            <td>{{ ticketReception.reason }}</td>
            <td class="text-right">
              <template v-if="ticketReception.ticket">
                <div
                  v-if="ticketReception.ticket.paid > ticketReception.ticket.totalMoney"
                  style="font-weight: 500; color: var(--text-green)"
                >
                  {{ formatMoney(ticketReception.ticket.paid) }} /
                  {{ formatMoney(ticketReception.ticket.totalMoney) }}
                </div>
                <div v-else>
                  {{ formatMoney(ticketReception.ticket.paid) }} /
                  {{ formatMoney(ticketReception.ticket.totalMoney) }}
                </div>
              </template>
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="
                  modalReceptionCreate?.openModal({
                    roomId: ticketReception.roomId,
                    ticketReception: ticketReception,
                    customer: ticketReception.customer,
                  })
                "
              >
                <IconEditSquare />
              </a>
            </td>
            <td class="text-center">
              <a
                style="color: var(--text-red)"
                class="text-xl"
                @click="
                  handleClickDestroy({
                    ticketId: ticketReception.ticketId,
                    ticketReceptionId: ticketReception.id,
                  })
                "
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
