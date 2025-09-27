<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import VueTag from '@/common/VueTag.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Procedure } from '@/modules/procedure'
import { TicketProcedure, TicketProcedureApi } from '@/modules/ticket-procedure'
import { timeToText } from '@/utils'
import LinkAndStatusTicket from '@/views/room/room-ticket-base/LinkAndStatusTicket.vue'
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ procedure: Procedure }>(), {
  procedure: () => Procedure.blank(),
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_TICKET_PAGINATION_LIMIT')) || 10)
const total = ref(0)
const ticketProcedureList = ref<TicketProcedure[]>([])

const startFetchData = async () => {
  try {
    const paginationResponse = await TicketProcedureApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        procedureId: props.procedure.id,
      },
      relation: { ticket: true, customer: true },
      sort: { id: 'DESC' },
    })
    ticketProcedureList.value = paginationResponse.ticketProcedureList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: ProcedureInvoice.vue:40 ~ startFetchData ~ error:', error)
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
  () => props.procedure.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketProcedureList.value = []
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
          <th>SL</th>
          <th>Giá</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="ticketProcedureList.length === 0">
          <td colspan="20" class="text-center">No data</td>
        </tr>
        <tr v-for="(ticketProcedure, index) in ticketProcedureList" :key="index">
          <td>
            <LinkAndStatusTicket :ticket="ticketProcedure.ticketProcess!" />
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(ticketProcedure.ticketProcess?.createdAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="">
            <div style="white-space: nowrap">
              <VueTag color="blue">{{ ticketProcedure?.customer?.fullName }}</VueTag>
            </div>
          </td>
          <td class="text-center">
            {{ ticketProcedure.quantity }}
          </td>
          <td class="text-right">
            <div
              v-if="ticketProcedure.discountMoney"
              class="text-xs italic line-through"
              style="color: var(--text-red)"
            >
              {{ formatMoney(ticketProcedure.expectedPrice) }}
            </div>
            {{ formatMoney(ticketProcedure.actualPrice) }}
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
