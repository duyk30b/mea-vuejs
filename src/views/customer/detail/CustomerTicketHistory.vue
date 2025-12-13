<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Ticket, TicketQueryApi, TicketStatus } from '@/modules/ticket'
import { ESTimer } from '@/utils'
import TicketLink from '@/views/room/room-ticket-base/TicketLink.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const ticketList = ref<Ticket[]>([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResult = await TicketQueryApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customerId: props.customerId },
      relation: { customer: false },
      sort: { id: 'DESC' },
    })
    ticketList.value = paginationResult.ticketList
    total.value = paginationResult.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerInvoicesHistory.vue:35 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
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
</script>

<template>
  <div class="mt-4">
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
              <div class="flex gap-1 items-center">
                <TicketLink :ticket="ticket!" :ticketId="ticket.id" target="_blank" />
                <TicketStatusTag :ticket="ticket!" :ticketId="ticket.id" />
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ ESTimer.timeToText(ticket.createdAt, 'hh:mm DD/MM/YYYY') }}
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
                Nợ: {{ formatMoney(ticket.debtAmount) }}
              </div>
              <div v-if="ticket.status === TicketStatus.Deposited" class="text-xs">
                Đã thanh toán: {{ formatMoney(ticket.paidAmount) }}
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
