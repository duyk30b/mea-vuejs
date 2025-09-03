<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import { InputSelect } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer, CustomerApi } from '@/modules/customer'
import { StatisticCustomerApi } from '@/modules/statistics/statistic-customer.api'
import { formatPhone } from '@/utils'
import type { ChartData } from 'chart.js'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'

const props = withDefaults(defineProps<{ limit?: number }>(), {
  limit: 10,
})

const settingStore = useSettingStore()
const moneyDivision = settingStore.SYSTEM_SETTING.moneyDivisionFormat
const { formatMoney, isMobile } = settingStore

const barData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
  labels: [],
  datasets: [],
})
const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
}

const loaded = ref(false)
const customerList = ref<Customer[]>([])
const sumDebt = ref(0)

const page = ref(1)
const limit = ref(props.limit)
const total = ref(0)

const startFetchData = async () => {
  try {
    loaded.value = false
    const [customerPagination, sumCustomerDebt] = await Promise.all([
      CustomerApi.pagination({
        page: page.value,
        limit: limit.value,
        filter: { debt: { NOT: 0 } },
        sort: { debt: 'DESC' },
      }),
      StatisticCustomerApi.sumCustomerDebt(),
    ])

    customerList.value = customerPagination.customerList
    total.value = customerPagination.total
    sumDebt.value = sumCustomerDebt

    barData.labels = Array.from({ length: limit.value }, (_, i) => '')
    barData.labels.splice(
      0,
      customerList.value.length,
      ...customerList.value.map((i) => i.fullName),
    )
    barData.datasets = [
      {
        type: 'bar',
        label: 'Số nợ',
        data: Array.from({ length: limit.value }, (_, i) => 0),
        borderWidth: 1,
        stack: 'Stack 0',
      },
    ]
    barData.datasets[0].data.splice(
      0,
      customerList.value.length,
      ...customerList.value.map((i) => i.debt / moneyDivision),
    )
  } catch (error) {
    console.log('🚀 ~ TopCustomerDebt.vue:38 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => await startFetchData())

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  await startFetchData()
}
</script>

<template>
  <div class="mt-4 flex flex-col" style="height: 100%">
    <div class="flex justify-between items-center">
      <span style="font-size: 18px; font-weight: 500">
        Danh sách khách nợ: (Tổng nợ {{ formatMoney(sumDebt) }})
      </span>
    </div>

    <div style="height: 500px">
      <Bar v-if="loaded" :data="barData" :options="barOptions" />
    </div>

    <div class="mt-2 table-wrapper">
      <div class="text-lg" style="font-weight: 500">Thông số chi tiết</div>
      <table class="">
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>#</th>
            <th>Tên KH</th>
            <th>SĐT</th>
            <th>Nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="customerList.length === 0">
            <td colspan="20" class="text-center">Không có khách hàng nợ</td>
          </tr>
          <tr v-for="(customer, index) in customerList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              {{ customer.id }}
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ index + 1 }}
            </td>
            <td>{{ customer.fullName }}</td>
            <td class="text-center" style="white-space: nowrap">
              <a :href="'tel:' + customer.phone">
                {{ formatPhone(customer.phone || '') }}
              </a>
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ formatMoney(customer.debt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="py-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
      <InputSelect
        v-model:value="limit"
        @update:value="(l: any) => changePagination({ page, limit: l })"
        :options="[
          { value: 10, label: '10 / page' },
          { value: 20, label: '20 / page' },
          { value: 50, label: '50 / page' },
          { value: 100, label: '100 / page' },
        ]"
      />
    </div>
  </div>
</template>
