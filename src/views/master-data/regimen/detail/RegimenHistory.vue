<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import VueTag from '@/common/VueTag.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Regimen } from '@/modules/regimen'
import { TicketRegimen, TicketRegimenApi } from '@/modules/ticket-regimen'
import { timeToText } from '@/utils'
import LinkAndStatusTicket from '@/views/room/room-ticket-base/LinkAndStatusTicket.vue'
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ regimen: Regimen }>(), {
  regimen: () => Regimen.blank(),
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const page = ref(1)
const limit = ref(10)
const total = ref(0)
const ticketRegimenList = ref<TicketRegimen[]>([])

const startFetchData = async () => {
  try {
    const paginationResponse = await TicketRegimenApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        regimenId: props.regimen.id,
      },
      relation: { ticket: true, customer: true },
      sort: { id: 'DESC' },
    })
    ticketRegimenList.value = paginationResponse.ticketRegimenList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: RegimenInvoice.vue:40 ~ startFetchData ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  await startFetchData()
}

watch(
  () => props.regimen.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketRegimenList.value = []
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
          <th>Giá</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="ticketRegimenList.length === 0">
          <td colspan="20" class="text-center">No data</td>
        </tr>
        <tr v-for="(ticketRegimen, index) in ticketRegimenList" :key="index">
          <td>
            <LinkAndStatusTicket :ticket="ticketRegimen.ticket!" />
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(ticketRegimen.ticket?.startedAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="">
            <div style="white-space: nowrap">
              <VueTag color="blue">{{ ticketRegimen?.customer?.fullName }}</VueTag>
            </div>
          </td>
          <td class="text-right">
            <div
              v-if="ticketRegimen.discountMoney"
              class="text-xs italic line-through"
              style="color: var(--text-red)"
            >
              {{ formatMoney(ticketRegimen.expectedPrice) }}
            </div>
            {{ formatMoney(ticketRegimen.actualPrice) }}
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
