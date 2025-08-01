<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VuePagination from '../../../common/VuePagination.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { TicketProcedure, TicketProcedureApi } from '../../../modules/ticket-procedure'
import { ESTimer } from '../../../utils'
import LinkAndStatusTicket from '../../ticket-base/LinkAndStatusTicket.vue'

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProcedureList = ref<TicketProcedure[]>([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await TicketProcedureApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        customerId: props.customerId,
      },
      relation: {
        procedure: true,
        ticket: true,
      },
      sort: { id: 'DESC' },
    })
    ticketProcedureList.value = data
    total.value = meta.total
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
    else ticketProcedureList.value = []
  },
  { immediate: true },
)
</script>

<template>
  <div class="mt-4">
    <div v-if="isMobile" class="mt-4 w-full table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Dịch vụ</th>
            <th>SL</th>
            <th>ĐG</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProcedureList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(ticketProcedure, index) in ticketProcedureList" :key="index">
            <td>
              <div class="font-medium">
                {{ ticketProcedure.procedure!.name }}
              </div>
              <LinkAndStatusTicket :ticket="ticketProcedure.ticket!" />
              <div style="font-size: 0.8rem">
                {{ ESTimer.timeToText(ticketProcedure.ticket?.startedAt, 'DD/MM/YYYY hh:mm') }}
              </div>
            </td>
            <td class="text-center">
              {{ ticketProcedure.quantity }}
            </td>
            <td class="text-right">
              <div
                v-if="ticketProcedure.discountMoney"
                style="
                  color: var(--text-red);
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                "
              >
                {{ formatMoney(ticketProcedure.expectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketProcedure.actualPrice) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="table-wrapper mt-4 w-full">
      <table>
        <thead>
          <tr>
            <th>HĐ</th>
            <th>Dịch vụ</th>
            <th>S.Lượng</th>
            <th>Đ.Giá</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProcedureList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticketProcedure, index) in ticketProcedureList" :key="index">
            <td>
              <LinkAndStatusTicket :ticket="ticketProcedure.ticket!" />
              <div style="font-size: 0.8rem">
                {{ ESTimer.timeToText(ticketProcedure.ticket?.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>{{ ticketProcedure.procedure?.name }}</td>
            <td class="text-center">
              {{ ticketProcedure.quantity }}
            </td>
            <td class="text-right">
              <div
                v-if="ticketProcedure.discountMoney"
                style="
                  color: var(--text-red);
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                "
              >
                {{ formatMoney(ticketProcedure.expectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketProcedure.actualPrice) }}
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
