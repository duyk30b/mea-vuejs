<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconVisibility } from '../../../../common/icon-google'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Paraclinical } from '../../../../modules/paraclinical'
import { TicketParaclinical, TicketParaclinicalApi } from '../../../../modules/ticket-paraclinical'
import { timeToText } from '../../../../utils'
import LinkAndStatusTicket from '../../../customer/detail/LinkAndStatusTicket.vue'
import ModalTicketParaclinicalResult from '../../../ticket-clinic/detail/modal/ModalTicketParaclinicalResult.vue'

const modalTicketParaclinicalResult = ref<InstanceType<typeof ModalTicketParaclinicalResult>>()
const props = withDefaults(defineProps<{ paraclinical: Paraclinical }>(), {
  paraclinical: () => Paraclinical.blank(),
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_TICKET_PAGINATION_LIMIT')) || 10)
const total = ref(0)
const ticketParaclinicalList = ref<TicketParaclinical[]>([])

const startFetchData = async () => {
  try {
    const { data, meta } = await TicketParaclinicalApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        paraclinicalId: props.paraclinical.id,
      },
      relation: { ticket: true, customer: true },
      sort: { id: 'DESC' },
    })
    ticketParaclinicalList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ParaclinicalInvoice.vue:40 ~ startFetchData ~ error:', error)
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
  () => props.paraclinical.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketParaclinicalList.value = []
  },
  { immediate: true }
)

const openBlankTicketOrderDetail = async (ticketId: number) => {
  let route = router.resolve({
    name: 'TicketOrderDetail',
    params: { id: ticketId },
  })
  window.open(route.href, '_blank')
}

const openBlankTicketClinicDetail = async (ticketId: number) => {
  let route = router.resolve({
    name: 'TicketClinicSummary',
    params: { id: ticketId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <ModalTicketParaclinicalResult ref="modalTicketParaclinicalResult" />
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Đơn</th>
          <th>K.Hàng</th>
          <th>Giá</th>
          <th>Kết quả</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="ticketParaclinicalList.length === 0">
          <td colspan="20" class="text-center">No data</td>
        </tr>
        <tr v-for="(ticketParaclinical, index) in ticketParaclinicalList" :key="index">
          <td>
            <LinkAndStatusTicket :ticket="ticketParaclinical.ticket!" />
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(ticketParaclinical.ticket?.startedAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="">
            <div style="white-space: nowrap">
              <span class="">
                <a-tag color="blue">{{ ticketParaclinical?.customer?.fullName }}</a-tag>
              </span>
            </div>
            <div v-if="ticketParaclinical.ticket?.note" style="font-size: 0.8rem; font-style: italic">
              {{ ticketParaclinical.ticket?.note }}
            </div>
          </td>
          <td class="text-right">
            <div
              v-if="ticketParaclinical.discountMoney"
              class="text-xs italic line-through"
              style="color: var(--text-red)">
              {{ formatMoney(ticketParaclinical.expectedPrice) }}
            </div>
            {{ formatMoney(ticketParaclinical.actualPrice) }}
          </td>
          <td class="text-center">
            <div class="flex items-center gap-2">
              <span>{{ ticketParaclinical.result }}</span>
              <a @click="modalTicketParaclinicalResult?.openModalById(ticketParaclinical.id)">
                <IconVisibility width="20" height="20" />
              </a>
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
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
    </div>
  </div>
</template>
