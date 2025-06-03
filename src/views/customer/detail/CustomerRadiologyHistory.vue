<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconVisibility } from '../../../common/icon-google'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { TicketRadiology, TicketRadiologyApi } from '../../../modules/ticket-radiology'
import { ESTimer } from '../../../utils'
import ModalTicketRadiologyResult from '../../ticket-clinic/detail/radiology/ModalTicketRadiologyResult.vue'
import VuePagination from '../../../common/VuePagination.vue'
import LinkAndStatusTicket from '../../ticket-base/LinkAndStatusTicket.vue'

const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketRadiologyList = ref<TicketRadiology[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_RADIOLOGY_HISTORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await TicketRadiologyApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        customerId: props.customerId!,
      },
      relation: {
        radiology: {},
        ticket: true,
      },
      sort: { id: 'DESC' },
    })
    ticketRadiologyList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerProductHistory copy.vue:37 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_RADIOLOGY_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

watch(
  () => props.customerId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketRadiologyList.value = []
  },
  { immediate: true },
)
</script>

<template>
  <ModalTicketRadiologyResult ref="modalTicketRadiologyResult" />
  <div class="mt-4">
    <div v-if="isMobile" class="mt-4 w-full table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Phiếu</th>
            <th>ĐG</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketRadiologyList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(ticketRadiology, index) in ticketRadiologyList" :key="index">
            <td>
              <div class="font-medium">
                {{ ticketRadiology.radiology!.name }}
              </div>
              <div>
                {{ ticketRadiology.result }}
              </div>
              <LinkAndStatusTicket :ticket="ticketRadiology.ticket!" />
              <div style="font-size: 0.8rem">
                {{ ESTimer.timeToText(ticketRadiology.ticket?.startedAt, 'DD/MM/YYYY hh:mm') }}
              </div>
            </td>
            <td class="text-right">
              <div
                v-if="ticketRadiology.discountMoney"
                style="
                  color: var(--text-red);
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                "
              >
                {{ formatMoney(ticketRadiology.expectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketRadiology.actualPrice) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!isMobile" class="table-wrapper mt-4 w-full">
      <table>
        <thead>
          <tr>
            <th>HĐ</th>
            <th>Phiếu</th>
            <th>Đ.Giá</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketRadiologyList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticketRadiology, index) in ticketRadiologyList" :key="index">
            <td>
              <LinkAndStatusTicket :ticket="ticketRadiology.ticket!" />
              <div style="font-size: 0.8rem">
                {{ ESTimer.timeToText(ticketRadiology.ticket?.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <div class="flex items-center gap-2" style="font-weight: 500">
                <span>{{ ticketRadiology.radiology?.name }}</span>
                <a
                  @click="
                    modalTicketRadiologyResult?.openModal(ticketRadiology.id, { noEdit: true })
                  "
                >
                  <IconVisibility width="20" height="20" />
                </a>
              </div>
              <div>{{ ticketRadiology.result }}</div>
            </td>
            <td class="text-right">
              <div
                v-if="ticketRadiology.discountMoney"
                style="
                  color: var(--text-red);
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                "
              >
                {{ formatMoney(ticketRadiology.expectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketRadiology.actualPrice) }}
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
