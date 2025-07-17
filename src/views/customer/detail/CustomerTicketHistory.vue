<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketQueryApi, TicketStatus } from '../../../modules/ticket'
import { ESTimer } from '../../../utils'
import LinkAndStatusTicket from '../../ticket-base/LinkAndStatusTicket.vue'

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const ticketList = ref<Ticket[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_TICKET_HISTORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await TicketQueryApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customerId: props.customerId },
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
  () => props.customerId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketList.value = []
  },
  { immediate: true },
)

const openBlankTicketOrderUpsert = (customerId: number) => {
  const route = router.resolve({
    name: 'TicketOrderUpsert',
    query: { customer_id: customerId, mode: 'CREATE' },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div class="mt-4">
    <div class="flex flex-wrap items-center gap-2">
      <div>
        <VueButton
          v-if="userPermission[PermissionId.TICKET_ORDER_DRAFT_CRUD]"
          color="blue"
          icon="plus"
          @click="openBlankTicketOrderUpsert(customerId!)"
        >
          Bán hàng mới
        </VueButton>
      </div>
    </div>
    <div class="mt-4 w-full table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Đơn hàng</th>
            <th>Ghi chú</th>
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
                {{ ESTimer.timeToText(ticket.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <div class="max-line-2">{{ ticket.note }}</div>
            </td>
            <td class="text-right">
              <div style="font-weight: 500">
                {{ formatMoney(ticket.totalMoney) }}
              </div>
              <div v-if="ticket.status === TicketStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(ticket.debt) }}
              </div>
              <div v-if="ticket.status === TicketStatus.Deposited" class="text-xs">
                Đã thanh toán: {{ formatMoney(ticket.paid) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        class="ml-auto"
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
    </div>
  </div>
</template>
