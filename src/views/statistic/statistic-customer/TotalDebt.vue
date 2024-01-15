<script setup lang="ts">
import type { ChartData } from 'chart.js'
import { onBeforeMount, reactive, ref } from 'vue'
import { Pie } from 'vue-chartjs'
import { InvoiceService } from '../../../modules/invoice'
import { StatisticService } from '../../../modules/statistics'
import { useOrganizationStore } from '../../../store/organization.store'

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const badDebtDays = ref(30)
const totalCustomerDebt = ref(0)

const pieData = reactive<ChartData<'pie', number[], unknown>>({ labels: [], datasets: [] })
const options = reactive({
  responsive: true,
  // maintainAspectRatio: false,
  plugins: { legend: { reverse: true } },
})

const loaded = ref(false)

const startFetchData = async () => {
  try {
    loaded.value = false
    const [customerSumDebt, { invoiceSumDebt }] = await Promise.all([
      StatisticService.sumDebt(),
      InvoiceService.sumDebt({
        filter: { time: { LT: Date.now() - badDebtDays.value * 24 * 60 * 60 * 1000 } },
      }),
    ])
    totalCustomerDebt.value = customerSumDebt
    const newDebt = customerSumDebt - invoiceSumDebt
    const badDebt = invoiceSumDebt

    pieData.labels = ['Nợ mới', `Nợ cũ > ${badDebtDays.value} ngày`]
    pieData.datasets = [
      {
        // backgroundColor: ['#41B883', '#E46651'],
        data: [newDebt, badDebt],
      },
    ]
  } catch (error) {
    console.log('🚀 ~ file: ProductReport.vue:28 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => await startFetchData())

const handleChangeBadDebtDays = async (value: number) => {
  await startFetchData()
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center">
      <span style="font-size: 18px; font-weight: 500">
        Tổng nợ: {{ formatMoney(totalCustomerDebt) }}
      </span>
      <a-select
        v-model:value="badDebtDays"
        allow-clear
        style="width: 150px"
        @change="handleChangeBadDebtDays"
      >
        <a-select-option :value="30"> > 1 tháng </a-select-option>
        <a-select-option :value="90"> > 3 tháng </a-select-option>
        <a-select-option :value="180"> > 6 tháng </a-select-option>
        <a-select-option :value="365"> > 1 năm </a-select-option>
      </a-select>
    </div>
    <div class="mt-4 px-10">
      <Pie v-if="loaded" :data="pieData" :options="options" />
    </div>
  </div>
</template>
