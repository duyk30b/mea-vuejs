<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Laboratory } from '@/modules/laboratory'
import { TicketLaboratory, TicketLaboratoryApi } from '@/modules/ticket-laboratory'
import { timeToText } from '@/utils'
import LinkAndStatusTicket from '@/views/room/room-ticket-base/LinkAndStatusTicket.vue'
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ laboratory: Laboratory }>(), {
  laboratory: () => Laboratory.blank(),
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_TICKET_PAGINATION_LIMIT')) || 10)
const total = ref(0)
const ticketLaboratoryList = ref<TicketLaboratory[]>([])

const startFetchData = async () => {
  try {
    const paginationResponse = await TicketLaboratoryApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        laboratoryId: props.laboratory.id,
      },
      relation: { ticket: true, customer: true },
      sort: { id: 'DESC' },
    })
    ticketLaboratoryList.value = paginationResponse.ticketLaboratoryList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: LaboratoryInvoice.vue:40 ~ startFetchData ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PROCEDURE_TICKET_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

watch(
  () => props.laboratory.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketLaboratoryList.value = []
  },
  { immediate: true },
)
</script>

<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Đơn</th>
          <th>K.Hàng</th>
          <th>Kết quả</th>
          <th>Giá</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="ticketLaboratoryList.length === 0">
          <td colspan="20" class="text-center">No data</td>
        </tr>
        <tr v-for="(ticketLaboratory, index) in ticketLaboratoryList" :key="index">
          <td>
            <LinkAndStatusTicket :ticket="ticketLaboratory.ticket!" />
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(ticketLaboratory.ticket?.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="">
            <div style="white-space: nowrap">
              {{ ticketLaboratory?.customer?.fullName }}
            </div>
          </td>
          <td class="text-center">
            <!-- {{ ticketLaboratory.resultParse[laboratory.id] }} -->
          </td>
          <td class="text-right">
            <div
              v-if="ticketLaboratory.discountMoney"
              class="text-xs italic line-through"
              style="color: var(--text-red)"
            >
              {{ formatMoney(ticketLaboratory.expectedPrice) }}
            </div>
            {{ formatMoney(ticketLaboratory.actualPrice) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
    </div>
  </div>
</template>
