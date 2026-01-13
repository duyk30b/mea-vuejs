<script setup lang="ts">
import { IconBug } from '@/common/icon-antd'
import { IconVisibility } from '@/common/icon-google'
import { VueTooltip } from '@/common/popover'
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import {
  TicketRadiology,
  TicketRadiologyApi,
  TicketRadiologyService,
} from '@/modules/ticket-radiology'
import { ESTimer } from '@/utils'
import ModalTicketRadiologyResult from '@/views/room/room-radiology/ModalTicketRadiologyResult.vue'
import TicketLink from '@/views/room/room-ticket-base/TicketLink.vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketRadiologyList = ref<TicketRadiology[]>([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await TicketRadiologyApi.pagination({
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
    await TicketRadiologyService.refreshRelation(paginationResponse.ticketRadiologyList)
    ticketRadiologyList.value = paginationResponse.ticketRadiologyList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerProductHistory copy.vue:37 ~ error:', error)
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
              <TicketLink :ticket="ticketRadiology.ticket!" :ticketId="ticketRadiology.ticketId" />
              <div style="font-size: 0.8rem">
                {{ ESTimer.timeToText(ticketRadiology.ticket?.createdAt, 'DD/MM/YYYY hh:mm') }}
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
            <th v-if="CONFIG.MODE === 'development'"></th>
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
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                <template #trigger>
                  <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                </template>
                <pre>{{ JSON.stringify(ticketRadiology, null, 4) }}</pre>
              </VueTooltip>
            </td>
            <td>
              <TicketLink :ticket="ticketRadiology.ticket!" :ticketId="ticketRadiology.ticketId" />
              <div style="font-size: 0.8rem">
                {{ ESTimer.timeToText(ticketRadiology.ticket?.createdAt, 'hh:mm DD/MM/YYYY') }}
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
