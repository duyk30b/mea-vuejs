<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconVisibility } from '../../../../common/icon-google'
import VueTag from '../../../../common/VueTag.vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Radiology } from '../../../../modules/radiology'
import { TicketRadiology, TicketRadiologyApi } from '../../../../modules/ticket-radiology'
import { timeToText } from '../../../../utils'
import LinkAndStatusTicket from '../../../customer/detail/LinkAndStatusTicket.vue'
import ModalTicketRadiologyResult from '../../../ticket-clinic/detail/radiology/ModalTicketRadiologyResult.vue'

const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()
const props = withDefaults(defineProps<{ radiology: Radiology }>(), {
  radiology: () => Radiology.blank(),
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_TICKET_PAGINATION_LIMIT')) || 10)
const total = ref(0)
const ticketRadiologyList = ref<TicketRadiology[]>([])

const startFetchData = async () => {
  try {
    const { data, meta } = await TicketRadiologyApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        radiologyId: props.radiology.id,
      },
      relation: { ticket: true, customer: true },
      sort: { id: 'DESC' },
    })
    ticketRadiologyList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: RadiologyInvoice.vue:40 ~ startFetchData ~ error:', error)
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
  () => props.radiology.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketRadiologyList.value = []
  },
  { immediate: true }
)
</script>

<template>
  <ModalTicketRadiologyResult ref="modalTicketRadiologyResult" />
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
        <tr v-if="ticketRadiologyList.length === 0">
          <td colspan="20" class="text-center">No data</td>
        </tr>
        <tr v-for="(ticketRadiology, index) in ticketRadiologyList" :key="index">
          <td>
            <LinkAndStatusTicket :ticket="ticketRadiology.ticket!" />
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(ticketRadiology.ticket?.startedAt, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="">
            <div style="white-space: nowrap">
              <VueTag color="blue">{{ ticketRadiology?.customer?.fullName }}</VueTag>
            </div>
          </td>
          <td class="text-right">
            <div
              v-if="ticketRadiology.discountMoney"
              class="text-xs italic line-through"
              style="color: var(--text-red)">
              {{ formatMoney(ticketRadiology.expectedPrice) }}
            </div>
            {{ formatMoney(ticketRadiology.actualPrice) }}
          </td>
          <td class="text-center">
            <div class="flex items-center gap-2">
              <span>{{ ticketRadiology.result }}</span>
              <a
                @click="
                  modalTicketRadiologyResult?.openModal(ticketRadiology.id, { noEdit: true })
                ">
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
