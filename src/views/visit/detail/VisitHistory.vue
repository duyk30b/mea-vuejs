<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { VisitApi, type Visit } from '../../../modules/visit'
import { timeToText } from '../../../utils'
import { visit } from './visit.ref'

const dataLoading = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('INVOICE_PAGINATION_LIMIT')) || 10)
const total = ref(0)
const visitList = ref<Visit[]>([])

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await VisitApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: { visitDiagnosis: true },
      filter: {
        customerId: visit.value.customerId,
      },
      sort: { registeredAt: 'DESC' },
    })

    visitList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: VisitList.vue:72 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onMounted(async () => {
  await startFetchData()
})

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
  }
  await startFetchData()
}
</script>
<template>
  <div class="mt-4 bg-white p-4">
    <div>Lịch sử khám</div>
    <table>
      <thead>
        <tr>
          <th>T.Gian</th>
          <th>Chẩn đoán</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="visitHistory in visitList" :key="visitHistory.id">
          <td class="">
            {{ timeToText(visitHistory.registeredAt, 'hh:mm DD/MM/YYYY') }}
          </td>
          <td>
            {{ visit.visitDiagnosis?.diagnosis }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="scss" scope></script>
