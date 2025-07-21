<script setup lang="ts">
import { IconMore, IconSetting } from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { InputDate, InputSelect, VueSelect } from '@/common/vue-form'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { type Customer } from '@/modules/customer'
import { PaymentViewType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { roomFinancePagination, RoomService } from '@/modules/room'
import { Ticket, TicketQueryApi, TicketStatus, TicketType } from '@/modules/ticket'
import InputSearchCustomer from '@/views/component/InputSearchCustomer.vue'
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ESString, ESTimer, formatPhone } from '../../../utils'
import Breadcrumb from '../../component/Breadcrumb.vue'
import TicketStatusTag from '../../ticket-base/TicketStatusTag.vue'
import { fromTime, toTime } from './finance-ticket-list.ref'
import ModalTicketChangeAllMoney from './modal/ModalTicketChangeAllMoney.vue'
import ModalPrepaymentTicketItem from './modal/ModalPrepaymentTicketItem.vue'

const modalPrepaymentTicketItem = ref<InstanceType<typeof ModalPrepaymentTicketItem>>()
const modalTicketChangeAllMoney = ref<InstanceType<typeof ModalTicketChangeAllMoney>>()

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organization } = MeService

const dataLoading = ref(false)

const customerId = ref<number>(0)
const paymentStatus = ref<'prepayment' | 'payDebt' | ''>('prepayment')

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
        status: (() => {
          if (paymentStatus.value === 'prepayment') {
            return {
              IN: [
                TicketStatus.Draft,
                TicketStatus.Schedule,
                TicketStatus.Deposited,
                TicketStatus.Executing,
              ],
            }
          }
          if (paymentStatus.value === 'payDebt') {
            return TicketStatus.Debt
          }
          return undefined
        })(),
        ticketType: { NOT: TicketType.Order },
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            registeredAt: sortColumn.value === 'registeredAt' ? sortValue.value : undefined,
          }
        : { registeredAt: 'DESC' },
    })

    roomFinancePagination.value = paginationResult.ticketList
    total.value = paginationResult.total
  } catch (error) {
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  startFetchData({ dataLoading: true })
})

const selectCustomer = async (data?: Customer) => {
  console.log('🚀 ~ FinanceTicketList.vue:156 ~ selectCustomer ~ data:', data)
  if (data) {
    customerId.value = data?.id
    await startFetchData()
  }
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

const handleModalTicketChangeAllMoneySuccess = (ticketData: Ticket) => {}
</script>

<template>
  <ModalTicketChangeAllMoney
    ref="modalTicketChangeAllMoney"
    @success="handleModalTicketChangeAllMoneySuccess"
  />

  <ModalPrepaymentTicketItem ref="modalPrepaymentTicketItem" />

  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:block">
        <Breadcrumb />
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
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
        <div>Trạng thái thanh toán</div>
        <div>
          <VueSelect
            v-model:value="paymentStatus"
            :options="[
              { value: '', text: 'Tất cả' },
              { value: 'prepayment', text: 'Chờ thanh toán' },
              { value: 'payDebt', text: 'Chờ trả nợ' },
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
            <th class="">Tiếp đón</th>

            <th style="min-width: 150px">Khách hàng</th>
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
          <tr v-if="roomFinancePagination.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticket, index) in roomFinancePagination" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
              {{ ticket.id }}
            </td>
            <td>
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
              </div>
              <div>{{ roomMap[ticket.roomId]?.name || '' }}</div>
            </td>
            <td
              v-if="settingStore.TICKET_CLINIC_LIST.showCustomType"
              style="font-size: 1em; color: #555"
            >
              {{ settingStore.TICKET_CLINIC_LIST.customTypeText[ticket.customType || 0] }}
            </td>
            <td>
              <div><TicketStatusTag :ticket="ticket" /></div>
              <div style="font-size: 0.9em">
                {{ ESTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>

            <td>
              <div>
                {{ ticket.customer?.fullName }}
              </div>
              <div class="text-xs italic">
                <div>{{ ticket.customer?.note }}</div>
              </div>
              <div>{{ formatPhone(ticket.customer?.phone) }}</div>
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
            </td>
            <td class="text-right">
              <div>{{ formatMoney(ticket.paid) }} / {{ formatMoney(ticket.totalMoney) }}</div>
              <div v-if="ticket.status === TicketStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(ticket.debt) }}
              </div>
            </td>
            <td class="text-right">
              <div class="flex flex-wrap justify-center items-center">
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
                  color="blue"
                  icon="dollar"
                  size="small"
                  @click="
                    modalPrepaymentTicketItem?.openModal({
                      ticketId: ticket.id,
                      customer: ticket.customer!,
                    })
                  "
                >
                  <span>Thanh toán</span>
                </VueButton>
                <div></div>
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
                      v-if="userPermission[PermissionId.RECEPTION_CHANGE_ALL_MONEY]"
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
