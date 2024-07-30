<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { VoucherType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketApi, TicketStatus } from '../../../modules/ticket'
import { DTimer, formatPhone } from '../../../utils'
import TicketClinicStatusTag from '../../ticket-clinic/TicketClinicStatusTag.vue'
import TicketOrderStatusTag from '../../ticket-order/TicketOrderStatusTag.vue'
import LinkAndStatusTicket from './LinkAndStatusTicket.vue'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const ticketList = ref<Ticket[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_TICKET_HISTORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await TicketApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customerId: props.customer.id! },
      relation: { customer: false },
      sort: { id: 'DESC' },
    })
    ticketList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerInvoicesHistory.vue:35 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_TICKET_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

watch(
  () => props.customer.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketList.value = []
  },
  { immediate: true }
)

const openBlankTicketOrderUpsert = (customerId: number) => {
  let route = router.resolve({
    name: 'TicketOrderUpsert',
    query: { customer_id: customerId, mode: 'CREATE' },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div class="mt-4">
    <div class="flex flex-wrap items-center gap-2">
      <span>
        KH:
        <b>{{ customer.fullName }}</b>
      </span>
      <span>
        <a :href="'tel:' + customer.phone">{{ formatPhone(customer.phone || '') }}</a>
      </span>
      <span>
        - Công nợ hiện tại:
        <b>{{ formatMoney(customer.debt) }}</b>
      </span>
      <div class="ml-auto">
        <VueButton
          v-if="permissionIdMap[PermissionId.TICKET_ORDER_CREATE_DRAFT]"
          color="blue"
          icon="plus"
          @click="openBlankTicketOrderUpsert(customer.id!)">
          Bán hàng mới
        </VueButton>
      </div>
    </div>
    <div class="mt-4 w-full table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Đơn hàng</th>
            <th>Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(ticket, index) in ticketList" :key="index">
            <td>
              <LinkAndStatusTicket :ticket="ticket!" />
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ DTimer.timeToText(ticket.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td class="text-right">
              <div style="font-weight: 500">
                {{ formatMoney(ticket.totalMoney) }}
              </div>
              <div v-if="ticket.ticketStatus === TicketStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(ticket.debt) }}
              </div>
              <div v-if="ticket.ticketStatus === TicketStatus.Approved" class="text-xs">
                Đã thanh toán: {{ formatMoney(ticket.paid) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
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
