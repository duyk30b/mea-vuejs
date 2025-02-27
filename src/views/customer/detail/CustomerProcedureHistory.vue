<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { TicketProcedure, TicketProcedureApi } from '../../../modules/ticket-procedure'
import { DTimer, formatPhone } from '../../../utils'
import LinkAndStatusTicket from './LinkAndStatusTicket.vue'

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProcedureList = ref<TicketProcedure[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PROCEDURE_HISTORY_PAGINATION_LIMIT')) || 10)
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
    localStorage.setItem('CUSTOMER_PROCEDURE_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

watch(
  () => props.customerId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketProcedureList.value = []
  },
  { immediate: true }
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
                {{ DTimer.timeToText(ticketProcedure.ticket?.startedAt, 'DD/MM/YYYY hh:mm') }}
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
                ">
                {{ formatMoney(ticketProcedure.expectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketProcedure.actualPrice) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          size="small"
          :total="total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
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
                {{ DTimer.timeToText(ticketProcedure.ticket?.startedAt, 'hh:mm DD/MM/YYYY') }}
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
                ">
                {{ formatMoney(ticketProcedure.expectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketProcedure.actualPrice) }}
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
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
